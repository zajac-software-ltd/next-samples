# Service-to-Service Authentication

This document describes the JWT-based service authentication system that allows external applications to securely access API endpoints.

## Overview

The service authentication system is designed to allow trusted external applications (like your main app) to access specific API endpoints without requiring individual user authentication. It uses JWT tokens with configurable scopes for fine-grained permission control.

## Architecture

- **JWT Tokens**: Signed with `SERVICE_JWT_SECRET`
- **Scopes**: Permission-based access control
- **Middleware**: Routes starting with `/api/service/` bypass user authentication
- **Token Validation**: Each service endpoint validates tokens and required scopes

## Available Scopes

| Scope | Description |
|-------|-------------|
| `user:read` | Read user information |
| `user:create` | Create new users |
| `user:update` | Update existing users |
| `user:delete` | Delete users |
| `invite:send` | Send user invitations |
| `session:create` | Create temporary sessions |

## API Endpoints

### Users

#### `GET /api/service/users`
List users with pagination and filtering.

**Required Scope:** `user:read`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `email` (string): Filter by email (partial match)
- `role` (enum): Filter by role (USER, ADMIN)

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "USER",
      "emailVerified": "2023-12-01T12:00:00Z",
      "createdAt": "2023-12-01T12:00:00Z",
      "updatedAt": "2023-12-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "meta": {
    "requestedBy": "main-app",
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

#### `POST /api/service/users`
Create a new user.

**Required Scope:** `user:create`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "role": "USER"
}
```

**Response:**
```json
{
  "user": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "role": "USER",
    "emailVerified": "2023-12-01T12:00:00Z",
    "createdAt": "2023-12-01T12:00:00Z",
    "updatedAt": "2023-12-01T12:00:00Z"
  },
  "meta": {
    "createdBy": "main-app",
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Invitations

#### `POST /api/service/invites`
Send a user invitation.

**Required Scope:** `invite:send`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "USER",
  "expiresInHours": 24
}
```

**Response:**
```json
{
  "user": {
    "id": 3,
    "name": "New User",
    "email": "newuser@example.com",
    "role": "USER",
    "createdAt": "2023-12-01T12:00:00Z"
  },
  "invitation": {
    "claimToken": "abc123...",
    "claimUrl": "http://localhost:3000/auth/claim?token=abc123...",
    "expiresAt": "2023-12-02T12:00:00Z"
  },
  "meta": {
    "invitedBy": "main-app",
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

#### `GET /api/service/invites`
Get invitation status.

**Required Scope:** `invite:send`

**Query Parameters:**
- `email` (string): Filter by email
- `token` (string): Filter by claim token

**Response:**
```json
{
  "user": {
    "id": 3,
    "name": "New User",
    "email": "newuser@example.com",
    "role": "USER",
    "createdAt": "2023-12-01T12:00:00Z",
    "updatedAt": "2023-12-01T12:00:00Z"
  },
  "invitation": {
    "status": "pending",
    "expiresAt": "2023-12-02T12:00:00Z",
    "isExpired": false,
    "isClaimed": false
  },
  "meta": {
    "requestedBy": "main-app",
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Temporary Sessions

#### `POST /api/service/sessions`
Create a temporary session for a user.

**Required Scope:** `session:create`

**Request Body:**
```json
{
  "userId": 1,
  "expiresInHours": 1
}
```

**Response:**
```json
{
  "session": {
    "id": 1,
    "token": "temp123...",
    "expiresAt": "2023-12-01T13:00:00Z",
    "createdAt": "2023-12-01T12:00:00Z"
  },
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  },
  "meta": {
    "createdBy": "main-app",
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

#### `GET /api/service/sessions`
Validate a temporary session.

**Required Scope:** `session:create`

**Query Parameters:**
- `token` (string): Session token to validate
- `userId` (number): User ID to find sessions for

**Response:**
```json
{
  "session": {
    "id": 1,
    "token": "temp123...",
    "expiresAt": "2023-12-01T13:00:00Z",
    "createdAt": "2023-12-01T12:00:00Z",
    "isExpired": false,
    "isValid": true
  },
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  },
  "meta": {
    "requestedBy": "main-app",
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

## Setup

### 1. Environment Variables

Add to your `.env` file:
```bash
SERVICE_JWT_SECRET="your-secure-secret-here"
```

Generate a secure secret:
```bash
openssl rand -base64 64
```

### 2. Generate Service Tokens

Use the provided script to generate tokens:

```bash
npx tsx scripts/generate-service-token.ts [issuer] [scopes]
```

Examples:
```bash
# Generate token for main app with user read/create permissions
npx tsx scripts/generate-service-token.ts main-app "user:read,user:create"

# Generate token with all permissions for admin service
npx tsx scripts/generate-service-token.ts admin-service "user:read,user:create,user:update,user:delete,invite:send,session:create"
```

## Usage Examples

### Creating Users

```bash
curl -X POST http://localhost:3000/api/service/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }'
```

### Sending Invitations

```bash
curl -X POST http://localhost:3000/api/service/invites \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "role": "USER",
    "expiresInHours": 24
  }'
```

### Creating Temporary Sessions

```bash
curl -X POST http://localhost:3000/api/service/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "expiresInHours": 1
  }'
```

## Error Responses

All endpoints return consistent error responses:

### Authentication Errors
```json
{
  "error": "Missing or invalid authorization header"
}
```

### Authorization Errors
```json
{
  "error": "Insufficient permissions - user:read scope required"
}
```

### Validation Errors
```json
{
  "error": "Invalid request data",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

### Not Found Errors
```json
{
  "error": "User not found"
}
```

## Security Considerations

1. **Token Storage**: Store service tokens securely in your calling application
2. **Token Rotation**: Regularly rotate service tokens
3. **Scope Principle**: Use minimum required scopes for each service
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Consider implementing rate limiting for service endpoints
6. **Logging**: All service API calls are logged with the requesting service name

## Integration with Main Application

Your main application can use this service authentication to:

1. **Sync Users**: Create users in the client portal when they're created in the main app
2. **Send Invitations**: Send portal invitations to existing users
3. **Create Sessions**: Allow users to access the portal temporarily without full signup
4. **Monitor Status**: Check invitation and session status

This allows for seamless integration between your main application and the client portal while maintaining security and proper access control.
