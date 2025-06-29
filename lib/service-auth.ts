import jwt from 'jsonwebtoken';

export interface ServiceTokenPayload {
  iss: string; // issuer (the calling service)
  aud: string; // audience (this service)
  scope: string[]; // permissions/scopes
  exp: number; // expiration
  iat: number; // issued at
}

export interface ServiceAuthResult {
  isValid: boolean;
  payload?: ServiceTokenPayload;
  error?: string;
}

/**
 * Verify a service-to-service JWT token
 */
export function verifyServiceToken(token: string): ServiceAuthResult {
  try {
    if (!process.env.SERVICE_JWT_SECRET) {
      return { isValid: false, error: 'Service JWT secret not configured' };
    }

    const payload = jwt.verify(token, process.env.SERVICE_JWT_SECRET) as ServiceTokenPayload;
    
    // Validate required fields
    if (!payload.iss || !payload.aud || !payload.scope) {
      return { isValid: false, error: 'Invalid token structure' };
    }

    // Validate audience (this service)
    if (payload.aud !== 'client-portal') {
      return { isValid: false, error: 'Invalid audience' };
    }

    return { isValid: true, payload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { isValid: false, error: 'Token expired' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { isValid: false, error: 'Invalid token' };
    }
    return { isValid: false, error: 'Token verification failed' };
  }
}

/**
 * Generate a service token (for testing or internal use)
 */
export function generateServiceToken(
  issuer: string,
  scopes: string[],
  expiresIn: string = '1h'
): string {
  if (!process.env.SERVICE_JWT_SECRET) {
    throw new Error('Service JWT secret not configured');
  }

  const payload: Omit<ServiceTokenPayload, 'exp' | 'iat'> = {
    iss: issuer,
    aud: 'client-portal',
    scope: scopes,
  };

  return jwt.sign(payload, process.env.SERVICE_JWT_SECRET, {
    expiresIn,
  });
}

/**
 * Check if a service token has a specific scope
 */
export function hasScope(payload: ServiceTokenPayload, requiredScope: string): boolean {
  return payload.scope.includes(requiredScope);
}

/**
 * Common service scopes
 */
export const SERVICE_SCOPES = {
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  INVITE_SEND: 'invite:send',
  SESSION_CREATE: 'session:create',
} as const;
