# Enhanced Service Authentication - "Reversed Password Check"

This document describes the enhanced security system that combines JWT tokens with a "reversed password check" mechanism for superior API security.

## 🔒 Security Concept

### Traditional Pattern:
- **Database**: Stores password hashes
- **Client**: Submits plain password
- **Server**: Hashes plain password and compares with stored hash

### Reversed Pattern (Our Implementation):
- **Database**: Stores plain text secrets
- **Client**: Submits hash generated from plain secret
- **Server**: Generates expected hash from stored plain secret and compares

## 🛡️ Security Benefits

### **1. Dual Authentication**
- **JWT Token**: Proves service authorization and scope permissions
- **Hash Challenge**: Proves possession of shared secret

### **2. Enhanced Protection**
- **Token Theft Mitigation**: Stolen JWT is useless without the shared secret
- **Replay Attack Prevention**: Timestamp and nonce prevent request reuse
- **Request Binding**: Hash includes HTTP method and path
- **Time Window Validation**: Requests must be made within 5-minute window

### **3. Zero-Knowledge Proof**
- Client proves knowledge of secret without transmitting it
- Even if traffic is intercepted, the secret remains unknown

## 🔧 Implementation

### **Server Side Components**

#### 1. Service Client Management
```typescript
interface ServiceClient {
  id: string;                 // Client identifier
  name: string;              // Human-readable name
  plainSecret: string;       // Plain text secret (stored in DB)
  isActive: boolean;         // Enable/disable client
  allowedScopes: string[];   // Permitted operations
  createdAt: Date;
}
```

#### 2. Hash Generation Algorithm
```typescript
// Hash components: secret + timestamp + nonce + method + path
const payload = `${plainSecret}:${timestamp}:${nonce}:${method}:${path}`;
const hash = crypto.createHash('sha256').update(payload).digest('hex');
```

#### 3. Request Validation
1. Verify JWT token (authorization + scopes)
2. Extract enhanced auth headers
3. Validate timestamp (within 5-minute window)
4. Generate expected hash using stored secret
5. Compare with submitted hash
6. Check client permissions

### **Client Side Implementation**

Your main app would use the `ServiceAuthClient` class:

```javascript
import { ServiceAuthClient } from './service-auth-client';

// Initialize client
const authClient = new ServiceAuthClient('main-app', 'your-plain-secret');

// Make authenticated request
const headers = authClient.createHeaders(jwtToken, 'POST', '/api/service/secure/users');

fetch('https://portal.yourapp.com/api/service/secure/users', {
  method: 'POST',
  headers,
  body: JSON.stringify(userData)
});
```

## 📡 API Usage

### **Required Headers**

| Header | Description | Example |
|--------|-------------|---------|
| `Authorization` | JWT Bearer token | `Bearer eyJhbGciOiJIUzI1NiIs...` |
| `X-Client-ID` | Service client identifier | `main-app` |
| `X-Auth-Timestamp` | Unix timestamp (milliseconds) | `1703174400000` |
| `X-Auth-Nonce` | Random string (32 hex chars) | `a1b2c3d4e5f6...` |
| `X-Auth-Hash` | SHA256 hash of secret+timestamp+nonce+method+path | `d4e5f6a7b8c9...` |

### **Hash Calculation**
```javascript
const timestamp = Date.now();
const nonce = crypto.randomBytes(16).toString('hex');
const method = 'POST';
const path = '/api/service/secure/users';
const payload = `${plainSecret}:${timestamp}:${nonce}:${method}:${path}`;
const hash = crypto.createHash('sha256').update(payload).digest('hex');
```

## 🚀 Available Endpoints

### **Enhanced Security Endpoints**
- `GET /api/service/secure/users` - List users with enhanced auth
- `POST /api/service/secure/users` - Create user with enhanced auth
- *More endpoints can be added following the same pattern*

### **Standard Endpoints (JWT only)**
- `GET /api/service/users` - Standard JWT authentication
- `POST /api/service/invites` - Standard JWT authentication
- `GET /api/service/sessions` - Standard JWT authentication

## 🧪 Testing

### **Run the Demo**
```bash
# Start your Next.js server
npm run dev

# In another terminal, run the enhanced auth demo
npx tsx scripts/test-enhanced-auth.ts
```

This will demonstrate:
1. JWT token generation
2. Enhanced authentication header creation
3. API requests with dual authentication
4. User creation with enhanced security

## 🔐 Security Analysis

### **Attack Scenarios & Mitigations**

| Attack | Mitigation |
|--------|------------|
| **JWT Token Theft** | ✅ Useless without shared secret |
| **Replay Attack** | ✅ Timestamp validation prevents reuse |
| **Request Tampering** | ✅ Hash includes method/path binding |
| **Man-in-the-Middle** | ✅ Secret never transmitted |
| **Brute Force** | ✅ Strong secret + proper rate limiting |
| **Secret Compromise** | ⚠️ Requires secret rotation (same as traditional) |

### **Advantages vs Traditional**
1. **Stolen tokens are useless** without the secret
2. **No secret transmission** - only hashes are sent
3. **Request-specific binding** - can't reuse auth for different endpoints
4. **Time-bounded validity** - prevents old request replay

### **Considerations**
1. **Secret Storage**: Plain secrets must be stored securely in your database
2. **Clock Sync**: Client and server clocks should be reasonably synchronized
3. **Rate Limiting**: Implement proper rate limiting to prevent brute force
4. **Secret Rotation**: Plan for periodic secret rotation

## 🛠️ Setup Instructions

### **1. Environment Variables**
```bash
# Add to your .env file
MAIN_APP_SERVICE_SECRET="your-secure-plain-secret-here"
```

### **2. Client Integration**
In your main app, install the necessary crypto libraries and implement the `ServiceAuthClient` pattern.

### **3. Database Storage**
Store client secrets in your database:
```sql
CREATE TABLE service_clients (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plain_secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  allowed_scopes JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📈 Production Considerations

1. **Secret Management**: Use secure secret stores (AWS Secrets Manager, Azure Key Vault, etc.)
2. **Monitoring**: Log authentication attempts and failures
3. **Rate Limiting**: Implement per-client rate limiting
4. **Alerting**: Alert on repeated authentication failures
5. **Rotation**: Implement automated secret rotation
6. **Audit Trail**: Log all API calls with client identification

This enhanced security system provides enterprise-grade protection while maintaining ease of use and integration.
