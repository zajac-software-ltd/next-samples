import { NextRequest, NextResponse } from "next/server";
import { verifyServiceToken, hasScope, SERVICE_SCOPES } from "@/lib/service-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  expiresInHours: z.number().min(1).max(168).default(24), // 1 hour to 1 week
});

/**
 * Service endpoint to send user invitations
 * Requires SERVICE_SCOPES.INVITE_SEND scope
 */
export async function POST(request: NextRequest) {
  try {
    // Extract and verify service token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authResult = verifyServiceToken(token);

    if (!authResult.isValid || !authResult.payload) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid service token' },
        { status: 401 }
      );
    }

    // Check required scope
    if (!hasScope(authResult.payload, SERVICE_SCOPES.INVITE_SEND)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - invite:send scope required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = inviteUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, name, role, expiresInHours } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate secure claim token
    const claimToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));

    // Create user with claim token
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        claimToken,
        claimTokenExpires: expiresAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        claimToken: true,
        claimTokenExpires: true,
        createdAt: true,
      },
    });

    // Generate the claim URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const claimUrl = `${baseUrl}/auth/claim?token=${claimToken}`;

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      invitation: {
        claimToken: newUser.claimToken,
        claimUrl,
        expiresAt: newUser.claimTokenExpires,
      },
      meta: {
        invitedBy: authResult.payload.iss,
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Service API - Send invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Service endpoint to get invitation status
 * Requires SERVICE_SCOPES.INVITE_SEND scope
 */
export async function GET(request: NextRequest) {
  try {
    // Extract and verify service token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authResult = verifyServiceToken(token);

    if (!authResult.isValid || !authResult.payload) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid service token' },
        { status: 401 }
      );
    }

    // Check required scope
    if (!hasScope(authResult.payload, SERVICE_SCOPES.INVITE_SEND)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - invite:send scope required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const claimToken = searchParams.get('token');

    if (!email && !claimToken) {
      return NextResponse.json(
        { error: 'Either email or token parameter is required' },
        { status: 400 }
      );
    }

    // Find user by email or claim token
    const where: Record<string, unknown> = {};
    if (email) where.email = email;
    if (claimToken) where.claimToken = claimToken;

    const user = await prisma.user.findFirst({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        claimToken: true,
        claimTokenExpires: true,
        password: true, // To check if claimed
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired = user.claimTokenExpires && user.claimTokenExpires < now;
    const isClaimed = !!user.password;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      invitation: {
        status: isClaimed ? 'claimed' : isExpired ? 'expired' : 'pending',
        expiresAt: user.claimTokenExpires,
        isExpired,
        isClaimed,
      },
      meta: {
        requestedBy: authResult.payload.iss,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Service API - Get invitation status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
