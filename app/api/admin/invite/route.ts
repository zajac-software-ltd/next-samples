import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { generateClaimTokenExpiry } from '@/lib/auth-utils';

const inviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = inviteSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Generate secure claim token
    const claimToken = randomBytes(32).toString('hex');
    const claimTokenExpires = generateClaimTokenExpiry();

    // Create user with claim token
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        claimToken,
        claimTokenExpires,
        isClaimed: false,
      },
    });

    // Generate claim link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const claimLink = `${baseUrl}/auth/claim?token=${claimToken}`;

    return NextResponse.json({
      message: 'User invitation created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      claimLink,
      expiresAt: claimTokenExpires,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Invite user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
