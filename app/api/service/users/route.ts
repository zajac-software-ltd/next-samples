import { NextRequest, NextResponse } from "next/server";
import { verifyServiceToken, hasScope, SERVICE_SCOPES } from "@/lib/service-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  email: z.string().optional().nullable(),
  role: z.enum(["USER", "ADMIN"]).optional().nullable(),
});

/**
 * Service endpoint to get users
 * Requires SERVICE_SCOPES.USER_READ scope
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
    if (!hasScope(authResult.payload, SERVICE_SCOPES.USER_READ)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - user:read scope required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = getUsersSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      email: searchParams.get('email') || undefined,
      role: searchParams.get('role') || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, email, role } = queryResult.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (role) where.role = role;

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      meta: {
        requestedBy: authResult.payload.iss,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Service API - Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Service endpoint to create a user
 * Requires SERVICE_SCOPES.USER_CREATE scope
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
    if (!hasScope(authResult.payload, SERVICE_SCOPES.USER_CREATE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - user:create scope required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const userData = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        ...userData,
        emailVerified: new Date(), // Service-created users are considered verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: newUser,
      meta: {
        createdBy: authResult.payload.iss,
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Service API - Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
