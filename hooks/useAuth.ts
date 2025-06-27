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
    const checkTokenSession = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('temp-session-token');
        
        if (token) {
          // Send token in POST request body
          const response = await fetch('/api/auth/session-check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ token }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.session) {
              setTokenSession(data.session);
            } else {
              // Token is invalid, remove from localStorage
              localStorage.removeItem('temp-session-token');
            }
          } else {
            // Request failed, remove invalid token
            localStorage.removeItem('temp-session-token');
          }
        } else {
          // No token in localStorage, try cookie-based check (fallback)
          const response = await fetch('/api/auth/session-check', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.session) {
              setTokenSession(data.session);
            }
          }
        }
      } catch (error) {
        console.error('Token session check failed:', error);
        // Remove potentially invalid token
        localStorage.removeItem('temp-session-token');
      } finally {
        setIsLoadingToken(false);
      }
    };

    // Only check for token session if NextAuth session is not present or still loading
    if (!nextAuthSession && status !== 'loading') {
      checkTokenSession();
    } else {
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
    // Token-based session
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
