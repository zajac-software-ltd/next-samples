import { NextRequest, NextResponse } from "next/server";
import { verifyServiceToken, hasScope, SERVICE_SCOPES } from "@/lib/service-auth";
import { enhancedServiceAuth } from "@/lib/enhanced-service-auth";
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
  email: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

/**
 * Enhanced authentication verification
 */
function verifyEnhancedAuth(request: NextRequest, method: string) {
  // Extract JWT token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or invalid authorization header' };
  }

  const jwtToken = authHeader.substring(7);
  const jwtResult = verifyServiceToken(jwtToken);

  if (!jwtResult.isValid || !jwtResult.payload) {
    return { success: false, error: jwtResult.error || 'Invalid JWT token' };
  }

  // Extract enhanced auth headers
  const clientId = request.headers.get('X-Client-ID');
  const timestamp = request.headers.get('X-Auth-Timestamp');
  const nonce = request.headers.get('X-Auth-Nonce');
  const hash = request.headers.get('X-Auth-Hash');

  if (!clientId || !timestamp || !nonce || !hash) {
    return { 
      success: false, 
      error: 'Missing enhanced authentication headers (X-Client-ID, X-Auth-Timestamp, X-Auth-Nonce, X-Auth-Hash)' 
    };
  }

  // Verify enhanced authentication
  const path = new URL(request.url).pathname;
  const enhancedResult = enhancedServiceAuth.verifySecureAuth(
    clientId,
    {
      timestamp: parseInt(timestamp),
      nonce,
      hash,
    },
    method,
    path
  );

  if (!enhancedResult.isValid || !enhancedResult.client) {
    return { success: false, error: enhancedResult.error || 'Enhanced authentication failed' };
  }

  return {
    success: true,
    jwtPayload: jwtResult.payload!,
    client: enhancedResult.client!,
  };
}

/**
 * Enhanced service endpoint to get users
 * Requires both JWT token and enhanced authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify enhanced authentication
    const authResult = verifyEnhancedAuth(request, 'GET');
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { jwtPayload, client } = authResult;

    // Check JWT scope
    if (!hasScope(jwtPayload, SERVICE_SCOPES.USER_READ)) {
      return NextResponse.json(
        { error: 'Insufficient JWT permissions - user:read scope required' },
        { status: 403 }
      );
    }

    // Check client scope
    if (!enhancedServiceAuth.hasScope(client, SERVICE_SCOPES.USER_READ)) {
      return NextResponse.json(
        { error: 'Insufficient client permissions - user:read scope required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = getUsersSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      email: searchParams.get('email'),
      role: searchParams.get('role'),
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
        requestedBy: jwtPayload.iss,
        clientId: client.id,
        authMethod: 'enhanced',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Enhanced service API - Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Enhanced service endpoint to create a user
 * Requires both JWT token and enhanced authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify enhanced authentication
    const authResult = verifyEnhancedAuth(request, 'POST');
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { jwtPayload, client } = authResult;

    // Check JWT scope
    if (!hasScope(jwtPayload, SERVICE_SCOPES.USER_CREATE)) {
      return NextResponse.json(
        { error: 'Insufficient JWT permissions - user:create scope required' },
        { status: 403 }
      );
    }

    // Check client scope
    if (!enhancedServiceAuth.hasScope(client, SERVICE_SCOPES.USER_CREATE)) {
      return NextResponse.json(
        { error: 'Insufficient client permissions - user:create scope required' },
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
        createdBy: jwtPayload.iss,
        clientId: client.id,
        authMethod: 'enhanced',
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Enhanced service API - Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
