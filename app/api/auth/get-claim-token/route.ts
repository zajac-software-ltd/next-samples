import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers'

// Get the original claim token for a temporary session
export async function POST() {
  try {
    // Read session token from HTTP-only cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('temp-session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 400 });
    }

    // Find the session in the database
    const session = await prisma.session.findFirst({
      where: {
        sessionToken,
        expires: { gt: new Date() }, // Must not be expired
      },
      include: {
        user: {
          select: {
            claimToken: true,
            claimTokenExpires: true,
            isClaimed: true,
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 404 });
    }

    // Check if user still has a valid claim token and is not claimed
    if (!session.user.claimToken || 
        !session.user.claimTokenExpires || 
        session.user.claimTokenExpires < new Date() ||
        session.user.isClaimed) {
      return NextResponse.json({ error: 'No valid claim token available' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      claimToken: session.user.claimToken,
      claimUrl: `/auth/claim?token=${session.user.claimToken}`
    });

  } catch (error) {
    console.error('Get claim token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
