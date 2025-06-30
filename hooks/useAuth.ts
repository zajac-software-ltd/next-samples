"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { AuthSession, AuthType, UserStatus, checkPermissions } from "@/lib/auth-session"

interface UseAuthReturn {
  user: AuthSession['user'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTemporary: boolean;
  authType: AuthType;
  status: UserStatus;
  permissions: ReturnType<typeof checkPermissions>;
  session: AuthSession | null;
}

export function useAuth(): UseAuthReturn {
  const { data: nextAuthSession, status } = useSession();
  const [tokenSession, setTokenSession] = useState<AuthSession | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  // Check for token-based session
  useEffect(() => {
    const checkCookieSession = async () => {
      try {
        // Fetch session directly via httpOnly cookie
        const response = await fetch('/api/auth/session-check', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            setTokenSession(data.session);
          }
        }
      } catch (error) {
        console.error('Session cookie check failed:', error);
      } finally {
        setIsLoadingToken(false);
      }
    };

    // Only check for token session once NextAuth has settled and no credentials session
    if (!nextAuthSession && status !== 'loading') {
      checkCookieSession();
    } else if (nextAuthSession) {
      // Credentials session present, skip token check
      setIsLoadingToken(false);
    }
  }, [nextAuthSession, status]);

  // Determine current session
  let currentSession: AuthSession | null = null;
  
  if (nextAuthSession?.user) {
    // NextAuth.js session takes priority
    currentSession = {
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
  } else if (tokenSession) {
    // Token-based session via cookie
    currentSession = tokenSession;
  }

  const permissions = checkPermissions(currentSession);
  const isLoading = status === 'loading' || isLoadingToken;

  return {
    user: currentSession?.user || null,
    isLoading,
    isAuthenticated: permissions.isAuthenticated,
    isAdmin: permissions.isAdmin,
    isTemporary: permissions.isTemporary,
    authType: permissions.authType,
    status: currentSession?.status || UserStatus.UNAUTHENTICATED,
    permissions,
    session: currentSession,
  };
}
