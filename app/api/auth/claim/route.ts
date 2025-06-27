import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hashPassword, AUTH_CONFIG } from '@/lib/auth-utils';

const claimSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(AUTH_CONFIG.PASSWORD.MIN_LENGTH, `Password must be at least ${AUTH_CONFIG.PASSWORD.MIN_LENGTH} characters`),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = claimSchema.parse(body);

    // Find user with valid claim token
    const user = await prisma.user.findFirst({
      where: {
        claimToken: token,
        claimTokenExpires: {
          gt: new Date(),
        },
        isClaimed: false,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired claim token' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user: set password, mark as claimed, clear claim token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isClaimed: true,
        claimToken: null,
        claimTokenExpires: null,
      },
    });

    console.log('✅ Account claimed successfully for:', updatedUser.email);
    console.log('🔑 Auto-login credentials provided');

    return NextResponse.json({
      message: 'Account claimed successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      // Include credentials for auto-login
      autoLogin: {
        email: updatedUser.email,
        password: password, // Plain password for client-side signIn
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Claim account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to validate claim token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find user with valid claim token
    const user = await prisma.user.findFirst({
      where: {
        claimToken: token,
        claimTokenExpires: {
          gt: new Date(),
        },
        isClaimed: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        claimTokenExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired claim token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      user,
    });

  } catch (error) {
    console.error('Validate claim token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
