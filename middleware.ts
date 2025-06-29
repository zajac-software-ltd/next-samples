import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for NextAuth.js session (credentials authentication)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  let isAuthenticated = false;
  let isAdmin = false;
  let isTemporary = false;

  if (token) {
    // NextAuth.js session (credentials)
    isAuthenticated = true;
    isAdmin = token.role === 'ADMIN';
    isTemporary = false;
  } else {
    // Check for temp session cookie (fallback for server-side temp sessions)
    const tempSessionToken = req.cookies.get('temp-session-token')?.value;
    
    if (tempSessionToken) {
      isAuthenticated = true;
      isAdmin = false; // Token auth users cannot be admins
      isTemporary = true;
    }
  }

  // Protect admin routes - only credentials-authenticated admins
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated || !isAdmin || isTemporary) {
      return NextResponse.rewrite(new URL('/auth/unauthorized', req.url));
    }
  }

  // For dashboard routes, always allow access - let client-side handle auth
  // This prevents any NextAuth redirects for temp session users
  if (pathname.startsWith('/dashboard')) {
    // Set a header to indicate we've processed this in middleware
    const response = NextResponse.next();
    response.headers.set('x-middleware-processed', 'true');
    return response;
  }

  // Service API routes bypass user authentication (they have their own auth)
  if (pathname.startsWith('/api/service')) {
    return NextResponse.next();
  }

  // Protect API routes that require authentication
  if (pathname.startsWith('/api/users') || 
      pathname.startsWith('/api/admin')) {
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // API admin routes require full admin privileges (no temp sessions)
    if (pathname.startsWith('/api/admin') && (!isAdmin || isTemporary)) {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/users/:path*",
    "/api/admin/:path*",
    "/api/service/:path*"
  ]
}
