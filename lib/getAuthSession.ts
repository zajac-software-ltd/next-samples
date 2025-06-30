import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuthSession, AuthType, UserStatus } from '@/lib/auth-session'

/**
 * Server helper: retrieve the current authentication session.
 * Combines NextAuth.js credentials session and HTTP-only temp-session-token.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  // 1. Check NextAuth.js session (credentials)
  const nextAuth = await getServerSession(authOptions)
  if (nextAuth?.user) {
    return {
      user: {
        id: nextAuth.user.id,
        email: nextAuth.user.email || '',
        name: nextAuth.user.name || '',
        role: nextAuth.user.role,
      },
      authType: AuthType.CREDENTIALS,
      status: nextAuth.user.role === 'ADMIN'
        ? UserStatus.AUTHENTICATED_ADMIN
        : UserStatus.AUTHENTICATED,
      isTemporary: false,
    }
  }

  // 2. Check temp-session-token cookie
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('temp-session-token')?.value
  if (sessionToken) {
    // Validate session in database
    const dbSession = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    })
    if (dbSession && dbSession.expires > new Date() && dbSession.user.role !== 'ADMIN') {
      return {
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
      }
    }
  }

  return null
}

/**
 * Server action: require a valid session or throw.
 * Can be used in Server Components to enforce login.
 */
export async function requireAuth(): Promise<AuthSession> {
  'use server'
  const session = await getAuthSession()
  if (!session) {
    throw new Error('Not authenticated')
  }
  return session
}
