import { NextRequest, NextResponse } from "next/server";
import { verifyServiceToken, hasScope, SERVICE_SCOPES } from "@/lib/service-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const createSessionSchema = z.object({
  userId: z.number(),
  expiresInHours: z.number().min(1).max(24).default(1), // 1 to 24 hours
});

/**
 * Service endpoint to create temporary sessions
 * Requires SERVICE_SCOPES.SESSION_CREATE scope
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
    if (!hasScope(authResult.payload, SERVICE_SCOPES.SESSION_CREATE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - session:create scope required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { userId, expiresInHours } = validationResult.data;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate secure temp session token
    const tempToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));

    // Create temporary session
    const tempSession = await prisma.tempSession.create({
      data: {
        token: tempToken,
        userId: user.id,
        expiresAt,
      },
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      session: {
        id: tempSession.id,
        token: tempSession.token,
        expiresAt: tempSession.expiresAt,
        createdAt: tempSession.createdAt,
      },
      user: tempSession.user,
      meta: {
        createdBy: authResult.payload.iss,
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Service API - Create temp session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Service endpoint to validate temporary sessions
 * Requires SERVICE_SCOPES.SESSION_CREATE scope
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
    if (!hasScope(authResult.payload, SERVICE_SCOPES.SESSION_CREATE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - session:create scope required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!sessionToken && !userId) {
      return NextResponse.json(
        { error: 'Either token or userId parameter is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {};
    if (sessionToken) where.token = sessionToken;
    if (userId) where.userId = parseInt(userId);

    // Find temp session
    const tempSession = await prisma.tempSession.findFirst({
      where,
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!tempSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired = tempSession.expiresAt < now;

    return NextResponse.json({
      session: {
        id: tempSession.id,
        token: tempSession.token,
        expiresAt: tempSession.expiresAt,
        createdAt: tempSession.createdAt,
        isExpired,
        isValid: !isExpired,
      },
      user: tempSession.user,
      meta: {
        requestedBy: authResult.payload.iss,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Service API - Get temp session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
