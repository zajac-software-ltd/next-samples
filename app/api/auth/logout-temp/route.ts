import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('temp-session-token')?.value;
    
    if (sessionToken) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: {
          sessionToken,
        },
      });
    }

    // Clear the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('temp-session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
