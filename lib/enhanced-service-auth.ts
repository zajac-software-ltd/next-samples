import crypto from 'crypto';

export interface ServiceClient {
  id: string;
  name: string;
  plainSecret: string; // Stored in plain text (reverse of normal pattern)
  isActive: boolean;
  allowedScopes: string[];
  createdAt: Date;
}

export interface SecureAuthRequest {
  timestamp: number;
  nonce: string;
  hash: string; // Hash of: plainSecret + timestamp + nonce + method + path
}

/**
 * Enhanced service authentication with reversed password check
 */
export class EnhancedServiceAuth {
  private clients: Map<string, ServiceClient> = new Map();

  constructor() {
    this.loadClients();
  }

  /**
   * Load service clients (in production, this would come from database)
   */
  private loadClients() {
    // Example clients - in production, store in database
    const mainAppSecret = process.env.MAIN_APP_SERVICE_SECRET || 'default-secret-change-me';
    
    this.clients.set('main-app', {
      id: 'main-app',
      name: 'Main Application',
      plainSecret: mainAppSecret,
      isActive: true,
      allowedScopes: ['user:read', 'user:create', 'invite:send', 'session:create'],
      createdAt: new Date(),
    });
  }

  /**
   * Generate expected hash for verification
   */
  private generateHash(
    plainSecret: string, 
    timestamp: number, 
    nonce: string, 
    method: string, 
    path: string
  ): string {
    const payload = `${plainSecret}:${timestamp}:${nonce}:${method}:${path}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Verify the secure authentication request
   */
  public verifySecureAuth(
    clientId: string,
    authRequest: SecureAuthRequest,
    method: string,
    path: string
  ): { isValid: boolean; client?: ServiceClient; error?: string } {
    try {
      // Get client
      const client = this.clients.get(clientId);
      if (!client) {
        return { isValid: false, error: 'Unknown client' };
      }

      if (!client.isActive) {
        return { isValid: false, error: 'Client is inactive' };
      }

      // Check timestamp (prevent replay attacks)
      const now = Date.now();
      const timeDiff = Math.abs(now - authRequest.timestamp);
      const maxTimeDiff = 5 * 60 * 1000; // 5 minutes tolerance

      if (timeDiff > maxTimeDiff) {
        return { isValid: false, error: 'Request timestamp too old or too far in future' };
      }

      // Generate expected hash
      const expectedHash = this.generateHash(
        client.plainSecret,
        authRequest.timestamp,
        authRequest.nonce,
        method,
        path
      );

      // Verify hash
      if (authRequest.hash !== expectedHash) {
        return { isValid: false, error: 'Invalid authentication hash' };
      }

      return { isValid: true, client };

    } catch (error) {
      console.error('Enhanced service auth verification error:', error);
      return { isValid: false, error: 'Authentication verification failed' };
    }
  }

  /**
   * Get client by ID
   */
  public getClient(clientId: string): ServiceClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Check if client has required scope
   */
  public hasScope(client: ServiceClient, requiredScope: string): boolean {
    return client.allowedScopes.includes(requiredScope);
  }
}

/**
 * Helper class for external apps to generate secure auth requests
 */
export class ServiceAuthClient {
  constructor(
    private clientId: string,
    private plainSecret: string
  ) {}

  /**
   * Generate secure authentication request
   */
  public generateAuthRequest(method: string, path: string): SecureAuthRequest {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${this.plainSecret}:${timestamp}:${nonce}:${method}:${path}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    return {
      timestamp,
      nonce,
      hash,
    };
  }

  /**
   * Create headers for API request
   */
  public createHeaders(jwtToken: string, method: string, path: string): Record<string, string> {
    const authRequest = this.generateAuthRequest(method, path);
    
    return {
      'Authorization': `Bearer ${jwtToken}`,
      'X-Client-ID': this.clientId,
      'X-Auth-Timestamp': authRequest.timestamp.toString(),
      'X-Auth-Nonce': authRequest.nonce,
      'X-Auth-Hash': authRequest.hash,
      'Content-Type': 'application/json',
    };
  }
}

// Singleton instance
export const enhancedServiceAuth = new EnhancedServiceAuth();
