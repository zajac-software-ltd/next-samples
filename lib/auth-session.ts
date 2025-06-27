// Client-side authentication utilities and types
export enum AuthType {
  CREDENTIALS = 'credentials',
  TOKEN = 'token',
  NONE = 'none'
}

export enum UserStatus {
  AUTHENTICATED = 'authenticated',
  AUTHENTICATED_ADMIN = 'authenticated_admin', 
  AUTHENTICATED_TEMPORARY = 'authenticated_temporary',
  UNAUTHENTICATED = 'unauthenticated'
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: 'USER' | 'ADMIN';
  };
  authType: AuthType;
  status: UserStatus;
  isTemporary: boolean;
  expiresAt?: Date;
}

/**
 * Check user permissions based on auth session
 */
export function checkPermissions(session: AuthSession | null) {
  return {
    isAuthenticated: session !== null,
    isAdmin: session?.status === UserStatus.AUTHENTICATED_ADMIN,
    isTemporary: session?.isTemporary || false,
    canAccessDashboard: session !== null,
    canAccessAdmin: session?.status === UserStatus.AUTHENTICATED_ADMIN,
    canModifyUsers: session?.status === UserStatus.AUTHENTICATED_ADMIN,
    canClaimAccount: session?.isTemporary || false,
    authType: session?.authType || AuthType.NONE,
  };
}
