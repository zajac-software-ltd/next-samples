import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Define types locally to avoid import issues
enum AuthType {
  CREDENTIALS = 'credentials',
  TOKEN = 'token',
}

enum UserStatus {
  AUTHENTICATED = 'authenticated',
  AUTHENTICATED_ADMIN = 'authenticated_admin', 
  AUTHENTICATED_TEMPORARY = 'authenticated_temporary',
}

export async function GET() {
  try {
    // First check for NextAuth.js session (credentials)
    const nextAuthSession = await getServerSession(authOptions);
    
    if (nextAuthSession?.user) {
      const session = {
        user: {
          id: nextAuthSession.user.id,
          email: nextAuthSession.user.email,
          name: nextAuthSession.user.name,
          role: nextAuthSession.user.role,
        },
        authType: AuthType.CREDENTIALS,
        status: nextAuthSession.user.role === 'ADMIN' 
          ? UserStatus.AUTHENTICATED_ADMIN 
          : UserStatus.AUTHENTICATED,
        isTemporary: false,
      };
      
      return NextResponse.json({ 
        session,
        authenticated: true 
      });
    }

    // Check for token-based session in cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('temp-session-token')?.value;
    
    if (sessionToken) {
      // Validate session in database
      const dbSession = await prisma.session.findUnique({
        where: {
          sessionToken,
        },
        include: {
          user: true,
        },
      });

      if (!dbSession || !dbSession.user) {
        return NextResponse.json({ 
          session: null,
          authenticated: false 
        });
      }

      // Check if session has expired
      if (dbSession.expires < new Date()) {
        // Clean up expired session
        await prisma.session.delete({
          where: { sessionToken },
        });
        return NextResponse.json({ 
          session: null,
          authenticated: false 
        });
      }
      
      // Token auth users cannot be admins
      if (dbSession.user.role === 'ADMIN') {
        return NextResponse.json({ 
          session: null,
          authenticated: false 
        });
      }
      
      const session = {
        user: {
          id: dbSession.user.id.toString(),
          email: dbSession.user.email,
          name: dbSession.user.name,
          role: dbSession.user.role,
        },
        authType: AuthType.TOKEN,
        status: UserStatus.AUTHENTICATED_TEMPORARY,
        isTemporary: true,
        expiresAt: dbSession.expires,
      };
      
      return NextResponse.json({ 
        session,
        authenticated: true 
      });
    }
    
    return NextResponse.json({ 
      session: null,
      authenticated: false 
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ 
      session: null,
      authenticated: false,
      error: 'Session check failed' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body to get the token from localStorage
    const body = await request.json();
    const { token: sessionToken } = body;

    // First check for NextAuth.js session (credentials)
    const nextAuthSession = await getServerSession(authOptions);
    
    if (nextAuthSession?.user) {
      const session = {
        user: {
          id: nextAuthSession.user.id,
          email: nextAuthSession.user.email,
          name: nextAuthSession.user.name,
          role: nextAuthSession.user.role,
        },
        authType: AuthType.CREDENTIALS,
        status: nextAuthSession.user.role === 'ADMIN' 
          ? UserStatus.AUTHENTICATED_ADMIN 
          : UserStatus.AUTHENTICATED,
        isTemporary: false,
      };
      
      return NextResponse.json({ 
        session,
        authenticated: true 
      });
    }

    // Check for token-based session from localStorage
    if (sessionToken) {
      // Validate session in database
      const dbSession = await prisma.session.findUnique({
        where: {
          sessionToken,
        },
        include: {
          user: true,
        },
      });

      if (!dbSession || !dbSession.user) {
        return NextResponse.json({ 
          session: null,
          authenticated: false 
        });
      }

      // Check if session has expired
      if (dbSession.expires < new Date()) {
        // Clean up expired session
        await prisma.session.delete({
          where: { sessionToken },
        });
        return NextResponse.json({ 
          session: null,
          authenticated: false 
        });
      }
      
      // Token auth users cannot be admins
      if (dbSession.user.role === 'ADMIN') {
        return NextResponse.json({ 
          session: null,
          authenticated: false 
        });
      }
      
      const session = {
        user: {
          id: dbSession.user.id.toString(),
          email: dbSession.user.email,
          name: dbSession.user.name,
          role: dbSession.user.role,
        },
        authType: AuthType.TOKEN,
        status: UserStatus.AUTHENTICATED_TEMPORARY,
        isTemporary: true,
        expiresAt: dbSession.expires,
      };
      
      return NextResponse.json({ 
        session,
        authenticated: true 
      });
    }
    
    return NextResponse.json({ 
      session: null,
      authenticated: false 
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ 
      session: null,
      authenticated: false,
      error: 'Session check failed' 
    }, { status: 500 });
  }
}
