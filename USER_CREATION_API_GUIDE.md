# 🚀 API Guide: Creating Users & Generating Invite Links

## Quick Reference

### 1. Generate JWT Token First
```bash
POST /api/dev/generate-token
Content-Type: application/json

{
  "issuer": "your-app-name",
  "scopes": ["user:read", "user:create", "invite:send"],
  "expiresIn": "24h"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "scopes": ["user:read", "user:create", "invite:send"],
  "expiresAt": "2025-06-29T23:30:00.000Z"
}
```

---

## 🎯 Method 1: Create Active User (No Invitation)

**Use this when:** You want to create a user that's immediately active (for system/service accounts)

```bash
POST /api/service/users
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "user": {
    "id": 26,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "USER",
    "emailVerified": "2025-06-29T00:00:00.000Z",
    "createdAt": "2025-06-29T00:00:00.000Z"
  },
  "meta": {
    "createdBy": "your-app-name",
    "timestamp": "2025-06-29T00:00:00.000Z"
  }
}
```

---

## 📧 Method 2: Create User with Invitation Link

**Use this when:** You want users to set up their own password via email invitation

```bash
POST /api/service/invites
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "USER",
  "expiresInHours": 48
}
```

**Response:**
```json
{
  "user": {
    "id": 27,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "USER",
    "createdAt": "2025-06-29T00:00:00.000Z"
  },
  "invitation": {
    "claimToken": "e29125d65ece1b719fcd91d0477da482...",
    "claimUrl": "http://localhost:3000/auth/claim?token=e29125d65ece...",
    "expiresAt": "2025-07-01T00:00:00.000Z"
  },
  "meta": {
    "invitedBy": "your-app-name",
    "timestamp": "2025-06-29T00:00:00.000Z"
  }
}
```

---

## 🔍 Check Invitation Status

### By Email
```bash
GET /api/service/invites?email=jane@example.com
Authorization: Bearer YOUR_JWT_TOKEN
```

### By Token
```bash
GET /api/service/invites?token=e29125d65ece1b719fcd91d0477da482...
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "user": {
    "id": 27,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "USER"
  },
  "invitation": {
    "status": "pending",  // "pending", "claimed", or "expired"
    "expiresAt": "2025-07-01T00:00:00.000Z",
    "isExpired": false,
    "isClaimed": false
  }
}
```

---

## 📋 Complete Postman Test Flow

### 1. Set Environment Variables
- `baseUrl` = `http://localhost:3000`
- `jwtToken` = (will be set automatically)

### 2. Generate Token
**Request:** `POST {{baseUrl}}/api/dev/generate-token`
```json
{
  "issuer": "postman-test",
  "scopes": ["user:read", "user:create", "invite:send"],
  "expiresIn": "2h"
}
```

**Test Script (Auto-save token):**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set('jwtToken', response.token);
    console.log('JWT Token saved to environment');
}
```

### 3. Create User with Invitation
**Request:** `POST {{baseUrl}}/api/service/invites`
**Headers:** `Authorization: Bearer {{jwtToken}}`
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "role": "USER",
  "expiresInHours": 24
}
```

**Test Script (Save invitation details):**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set('inviteToken', response.invitation.claimToken);
    pm.environment.set('inviteUrl', response.invitation.claimUrl);
    pm.environment.set('testUserEmail', response.user.email);
    console.log('Invitation created:', response.invitation.claimUrl);
}
```

### 4. Check Invitation Status
**Request:** `GET {{baseUrl}}/api/service/invites?email={{testUserEmail}}`
**Headers:** `Authorization: Bearer {{jwtToken}}`

---

## 🎯 Use Cases

### Corporate Onboarding
```json
{
  "name": "New Employee",
  "email": "employee@company.com",
  "role": "USER",
  "expiresInHours": 168  // 1 week to set up account
}
```

### Admin Account Setup
```json
{
  "name": "System Administrator",
  "email": "admin@company.com",
  "role": "ADMIN",
  "expiresInHours": 72   // 3 days for admin setup
}
```

### Service Account (No Invitation)
```json
{
  "name": "API Service Account",
  "email": "service@company.com",
  "role": "USER"
}
```

---

## 🔐 Required Scopes

| Action | Required Scope |
|--------|----------------|
| Create active user | `user:create` |
| Send invitation | `invite:send` |
| Check invitation status | `invite:send` |
| List users | `user:read` |

---

## ⚠️ Important Notes

1. **Invitation URLs are secure** - Each contains a unique 64-character token
2. **Expiration is enforced** - Expired invitations cannot be claimed
3. **One-time use** - Once claimed, the invitation cannot be used again
4. **Email uniqueness** - Cannot create multiple users with the same email
5. **Role validation** - Only "USER" and "ADMIN" roles are supported

---

## 🧪 Testing Tips

1. **Always generate a fresh token** for testing
2. **Use unique emails** for each test (timestamp-based)
3. **Check invitation status** before and after claiming
4. **Test expiration** by setting short expiration times
5. **Verify error cases** (duplicate emails, invalid scopes, etc.)

Ready to test! 🚀
