import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// Allows unclaimed users to continue with a temporary session (1-hour)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Find user with valid claim token and not yet claimed
    const user = await prisma.user.findFirst({
      where: {
        claimToken: token,
        claimTokenExpires: { gt: new Date() },
        isClaimed: false,
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Admins cannot use token authentication for security
    if (user.role === 'ADMIN') {
      return NextResponse.json({ 
        error: 'Admin users must claim their account first' 
      }, { status: 403 });
    }

    // Create temporary session
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: expiresAt,
      },
    });

    console.log('🔑 Temporary session created for user:', user.email);
    console.log('⏰ Session expires in 1 hour');

    // Build response and set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresAt: expiresAt.toISOString(),
      redirectTo: '/dashboard'
    });
    response.cookies.set({
      name: 'temp-session-token',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });
    return response;
  } catch (err) {
    console.error('Continue without claiming error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
