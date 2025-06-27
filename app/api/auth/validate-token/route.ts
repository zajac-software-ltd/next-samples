import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie header
    const cookieHeader = request.headers.get('cookie');
    const tempSessionToken = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('temp-session-token='))
      ?.split('=')[1];

    if (!tempSessionToken) {
      return NextResponse.json({ valid: false });
    }

    // Validate session in database
    const session = await prisma.session.findUnique({
      where: {
        sessionToken: tempSessionToken,
      },
      include: {
        user: true,
      },
    });

    if (!session || !session.user) {
      return NextResponse.json({ valid: false });
    }

    // Check if session has expired
    if (session.expires < new Date()) {
      // Clean up expired session
      await prisma.session.delete({
        where: { sessionToken: tempSessionToken },
      });
      return NextResponse.json({ valid: false });
    }

    // Don't allow admin users via token auth
    if (session.user.role === 'ADMIN') {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id.toString(),
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      expiresAt: session.expires,
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
