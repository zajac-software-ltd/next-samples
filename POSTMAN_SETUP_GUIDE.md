# Postman Testing Guide for Service API

This guide will walk you through testing the Service API endpoints using Postman with the pre-configured collection.

## Quick Setup

### 1. Import the Collection
- Open Postman
- Click "Import" button
- Select the file: `postman/Service-Authentication-Collection.json`
- The collection will be imported with all endpoints pre-configured

### 2. Set Up Environment Variables
Create a new environment in Postman with these variables:

```
Variable Name: baseUrl
Initial Value: http://localhost:3000
Current Value: http://localhost:3000
```

### 3. Quick Test Flow

**Step 1: Generate a Token**
1. Open the collection: "Service Authentication API"
2. Go to "🔑 Token Management" → "Generate JWT Token"
3. Click "Send"
4. The token will be automatically saved to your environment as `jwtToken`

**Step 2: Test Standard JWT Endpoints**
1. Go to "📝 Standard JWT Auth" → "Get Users (Standard)"
2. Click "Send" - should return paginated user list
3. Try "Create User (Standard)" - creates a new user

**Step 3: Test Enhanced Authentication**
1. Go to "🔐 Enhanced Authentication" → "Get Available Scopes"
2. Try "Get Users (Enhanced)" - uses both JWT + hash verification

## Detailed Testing

### Available Endpoints

#### Token Management
- `GET /api/dev/generate-token` - Get available scopes
- `POST /api/dev/generate-token` - Generate JWT token

#### Standard JWT Authentication
- `GET /api/service/users` - List users (requires `user:read` scope)
- `POST /api/service/users` - Create user (requires `user:create` scope)
- `GET /api/service/invites` - List invites (requires `invite:read` scope)
- `POST /api/service/invites` - Send invite (requires `invite:send` scope)

#### Enhanced Authentication (JWT + Hash)
- `GET /api/service/secure/users` - Enhanced auth users endpoint

### Testing Different Scenarios

#### 1. Valid Authentication
```bash
# Headers
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

# Example request
GET /api/service/users?page=1&limit=5
```

#### 2. Invalid Token
```bash
# Headers
Authorization: Bearer invalid-token

# Expected: 401 Unauthorized
```

#### 3. Missing Scopes
```bash
# Generate token with limited scopes
POST /api/dev/generate-token
{
  "scopes": ["user:read"]  # Only read, no create
}

# Try to create user - should fail with 403
POST /api/service/users
```

#### 4. Enhanced Authentication
The enhanced auth endpoint requires:
- Valid JWT token
- Cryptographic hash proof
- Timestamp validation
- Nonce uniqueness

### Query Parameters

#### GET /api/service/users
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `email` (optional): Filter by email (partial match)
- `role` (optional): Filter by role ("USER" or "ADMIN")

Example: `/api/service/users?page=2&limit=20&role=ADMIN`

#### POST /api/service/users
Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",  // optional
  "role": "USER"           // optional, defaults to "USER"
}
```

### Expected Responses

#### Success Response - GET Users
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "USER",
      "emailVerified": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  },
  "meta": {
    "requestedBy": "your-service-name",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Success Response - Create User
```json
{
  "user": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": null,
    "role": "USER",
    "emailVerified": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "createdBy": "your-service-name",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses
```json
// 401 - Unauthorized
{
  "error": "Missing or invalid authorization header"
}

// 403 - Forbidden
{
  "error": "Insufficient permissions - user:read scope required"
}

// 400 - Bad Request
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["name"],
      "message": "Required"
    }
  ]
}

// 409 - Conflict
{
  "error": "User with this email already exists"
}
```

### Common Issues and Solutions

#### 1. "Invalid authorization header"
- Check that the Authorization header is formatted as: `Bearer <token>`
- Ensure the token is properly generated and not expired

#### 2. "Insufficient permissions"
- Verify the token has the required scopes
- Re-generate token with appropriate scopes

#### 3. "Invalid request data"
- Check that all required fields are included
- Verify data types match the schema requirements

#### 4. "User with this email already exists"
- Use a different email address
- Check existing users first

### Development Tips

1. **Use Environment Variables**: Store tokens and base URLs in Postman environments
2. **Test Scripts**: The collection includes test scripts that automatically save tokens
3. **Token Expiration**: Generate new tokens when they expire (default: 24h)
4. **Scope Testing**: Test different scope combinations to verify authorization
5. **Error Handling**: Test error scenarios to ensure proper error responses

### Next Steps

1. Test all endpoints in the collection
2. Try different query parameters and filters
3. Test error scenarios (invalid tokens, missing scopes, etc.)
4. Experiment with the enhanced authentication endpoints
5. Use the enhanced auth pre-request scripts for automatic hash generation

The collection is designed to be comprehensive and includes examples for all major use cases. Start with the basic JWT authentication and progress to the enhanced authentication features.
