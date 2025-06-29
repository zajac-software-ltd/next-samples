# 📋 POSTMAN QUICK START GUIDE

## 🚀 How to Create Users & Generate Invite Links in Postman

### 1. Import Collection & Set Environment

**Import the Collection:**
- File: `postman/Service-Authentication-Collection.json`

**Create Environment:**
- Name: `Local Development`
- Variable: `baseUrl` = `http://localhost:3000`

### 2. Generate JWT Token

**Request:** `POST {{baseUrl}}/api/dev/generate-token`

**Body (JSON):**
```json
{
  "issuer": "postman-user-creation",
  "scopes": ["user:read", "user:create", "invite:send"],
  "expiresIn": "2h"
}
```

**Post-Response Script (Auto-save token):**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set('jwtToken', response.token);
    console.log('✅ JWT Token saved to environment');
    console.log('Token expires:', response.expiresAt);
}
```

### 3. Create User with Invitation Link

**Request:** `POST {{baseUrl}}/api/service/invites`

**Headers:**
```
Authorization: Bearer {{jwtToken}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "{{$randomFullName}}",
  "email": "{{$randomEmail}}",
  "role": "USER",
  "expiresInHours": 48
}
```

**Post-Response Script (Save invitation details):**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set('lastInviteToken', response.invitation.claimToken);
    pm.environment.set('lastInviteUrl', response.invitation.claimUrl);
    pm.environment.set('lastInviteEmail', response.user.email);
    pm.environment.set('lastUserId', response.user.id);
    
    console.log('✅ User invited successfully');
    console.log('👤 User ID:', response.user.id);
    console.log('📧 Email:', response.user.email);
    console.log('🔗 Claim URL:', response.invitation.claimUrl);
    console.log('⏰ Expires:', response.invitation.expiresAt);
}
```

### 4. Create Active User (No Invitation)

**Request:** `POST {{baseUrl}}/api/service/users`

**Headers:**
```
Authorization: Bearer {{jwtToken}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "{{$randomFullName}}",
  "email": "{{$randomEmail}}",
  "role": "USER",
  "phone": "{{$randomPhoneNumber}}"
}
```

### 5. Check Invitation Status

**Request:** `GET {{baseUrl}}/api/service/invites?email={{lastInviteEmail}}`

**Headers:**
```
Authorization: Bearer {{jwtToken}}
```

**Alternative - Check by Token:**
`GET {{baseUrl}}/api/service/invites?token={{lastInviteToken}}`

### 6. Create Admin with Long Expiration

**Request:** `POST {{baseUrl}}/api/service/invites`

**Body (JSON):**
```json
{
  "name": "System Administrator",
  "email": "admin@{{$randomDomainName}}",
  "role": "ADMIN",
  "expiresInHours": 168
}
```

### 7. List All Users

**Request:** `GET {{baseUrl}}/api/service/users?limit=20&page=1`

**Headers:**
```
Authorization: Bearer {{jwtToken}}
```

---

## 🎯 Pre-configured Postman Requests

### Collection Structure:
```
📁 Service Authentication API
├── 🔑 Token Management
│   ├── Get Available Scopes
│   └── Generate JWT Token (with auto-save)
├── 📝 User Creation
│   ├── Create User with Invitation
│   ├── Create Active User (No Invite)
│   ├── Create Admin User
│   └── Bulk Create Users
├── 📧 Invitation Management
│   ├── Check Invitation Status (by Email)
│   ├── Check Invitation Status (by Token)
│   └── List Pending Invitations
└── 📊 User Management
    ├── List All Users
    ├── Filter Users by Role
    └── Search Users by Email
```

---

## 💡 Postman Variables Used

| Variable | Description | Example |
|----------|-------------|---------|
| `{{baseUrl}}` | Your API base URL | `http://localhost:3000` |
| `{{jwtToken}}` | Auto-saved JWT token | `eyJhbGciOiJIUzI1NiIs...` |
| `{{lastInviteToken}}` | Last created invite token | `abc123def456...` |
| `{{lastInviteUrl}}` | Last created invite URL | `http://...auth/claim?token=...` |
| `{{lastInviteEmail}}` | Last invited user email | `user@example.com` |
| `{{$randomFullName}}` | Postman dynamic variable | `John Doe` |
| `{{$randomEmail}}` | Postman dynamic variable | `user@example.com` |

---

## 🔄 Test Workflow in Postman

1. **Generate Token** (saves to `{{jwtToken}}`)
2. **Create User with Invitation** (saves invite details)
3. **Check Invitation Status** (uses saved email)
4. **Visit Claim URL** (copy from response or use `{{lastInviteUrl}}`)
5. **Verify User List** (see the created users)

---

## 🧪 Advanced Testing Scenarios

### Test Expired Invitations
```json
{
  "name": "Short Expiry Test",
  "email": "expiry-test@example.com",
  "role": "USER",
  "expiresInHours": 0.1
}
```

### Test Invalid Scopes
Create token with limited scopes:
```json
{
  "issuer": "limited-test",
  "scopes": ["user:read"],
  "expiresIn": "1h"
}
```
Then try to create users (should fail with 403).

### Test Duplicate Email
1. Create a user
2. Try to create another user with the same email
3. Should get 409 Conflict

---

## 📱 Testing the Complete Flow

1. **API creates invitation** → Returns claim URL
2. **User visits claim URL** → Sets up password
3. **API checks status** → Shows "claimed" status
4. **User can now login** → Using email/password

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Generate new JWT token |
| 403 Forbidden | Check token has required scopes |
| 409 Conflict | Use different email address |
| Token expired | Generate fresh token |
| Invalid claim URL | Check token hasn't expired |

---

## ✅ Quick Verification Commands

**Check if server is running:**
```bash
curl http://localhost:3000/api/dev/generate-token
```

**Test with fresh token:**
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/dev/generate-token -H "Content-Type: application/json" -d '{"issuer":"test","scopes":["invite:send"],"expiresIn":"1h"}' | jq -r '.token')

# Create invitation
curl -X POST http://localhost:3000/api/service/invites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","role":"USER","expiresInHours":24}' | jq '.'
```

Ready to create users and invitations! 🎉
