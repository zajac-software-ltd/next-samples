import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?error=missing-token', request.url));
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
    });

    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid-token', request.url));
    }

    // If user exists and token is valid, redirect to claim page
    return NextResponse.redirect(new URL(`/auth/claim?token=${token}`, request.url));

  } catch (error) {
    console.error('Link login error:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=server-error', request.url));
  }
}
