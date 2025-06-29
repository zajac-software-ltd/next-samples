# 📋 **POSTMAN QUICK REFERENCE CARD**

## **🚀 Ready-to-Copy Requests**

### **1. Generate Token**
```
POST {{baseUrl}}/api/dev/generate-token
Content-Type: application/json

{
  "issuer": "postman-test",
  "scopes": ["user:read", "user:create", "invite:send"],
  "expiresIn": "2h"
}
```

### **2. Create User with Invitation**
```
POST {{baseUrl}}/api/service/invites
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

{
  "name": "{{$randomFullName}}",
  "email": "test-{{$timestamp}}@example.com",
  "role": "USER",
  "expiresInHours": 48
}
```

### **3. Create Active User**
```
POST {{baseUrl}}/api/service/users
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

{
  "name": "{{$randomFullName}}",
  "email": "active-{{$timestamp}}@example.com",
  "role": "USER",
  "phone": "{{$randomPhoneNumber}}"
}
```

### **4. Check Invitation Status**
```
GET {{baseUrl}}/api/service/invites?email=test-EMAIL-HERE@example.com
Authorization: Bearer {{jwtToken}}
```

### **5. List Users**
```
GET {{baseUrl}}/api/service/users?limit=10&page=1
Authorization: Bearer {{jwtToken}}
```

---

## **🎯 POST-RESPONSE SCRIPTS**

### **Auto-save Token:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set('jwtToken', response.token);
    console.log('✅ Token saved:', response.token.substring(0, 30) + '...');
}
```

### **Auto-save Invitation Details:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set('lastInviteUrl', response.invitation.claimUrl);
    pm.environment.set('lastInviteEmail', response.user.email);
    pm.environment.set('lastInviteToken', response.invitation.claimToken);
    console.log('✅ Invitation created for:', response.user.email);
    console.log('🔗 Claim URL:', response.invitation.claimUrl);
}
```

---

## **⚡ KEYBOARD SHORTCUTS**

- **Send Request**: `Ctrl/Cmd + Enter`
- **New Request**: `Ctrl/Cmd + N`
- **Save Request**: `Ctrl/Cmd + S`
- **Format JSON**: `Ctrl/Cmd + B`
- **Toggle Sidebar**: `Ctrl/Cmd + \`

---

## **🔧 COMMON VARIABLES**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{baseUrl}}` | API base URL | `http://localhost:3000` |
| `{{jwtToken}}` | Current JWT token | `eyJhbGciOiJIUzI1NiIs...` |
| `{{$timestamp}}` | Unix timestamp | `1751156186` |
| `{{$randomEmail}}` | Random email | `user@example.com` |
| `{{$randomFullName}}` | Random name | `John Doe` |
| `{{$randomPhoneNumber}}` | Random phone | `+1234567890` |

---

## **✅ SUCCESS INDICATORS**

| Request | Success Status | Key Response Fields |
|---------|----------------|---------------------|
| Generate Token | `200 OK` | `token`, `scopes`, `expiresAt` |
| Create Invitation | `201 Created` | `user.id`, `invitation.claimUrl` |
| Create User | `201 Created` | `user.id`, `user.emailVerified` |
| Check Status | `200 OK` | `invitation.status`, `invitation.isClaimed` |
| List Users | `200 OK` | `users[]`, `pagination.total` |

---

## **🚨 ERROR RESPONSES**

| Status | Meaning | Common Cause |
|--------|---------|--------------|
| `401` | Unauthorized | Invalid/missing JWT token |
| `403` | Forbidden | Missing required scopes |
| `400` | Bad Request | Invalid JSON or missing fields |
| `409` | Conflict | Email already exists |
| `404` | Not Found | Server not running |

---

## **🎯 TESTING SEQUENCE**

1. **Start server** → `npm run dev`
2. **Generate token** → Save to `{{jwtToken}}`
3. **Create invitation** → Copy claim URL
4. **Check status** → Should be "pending"
5. **Visit claim URL** → Set password in browser
6. **Check status again** → Should be "claimed"
7. **List users** → Verify creation

**Total time: ~2 minutes** ⏱️

---

## **🔗 USEFUL LINKS**

- **Server**: http://localhost:3000
- **Collection**: `postman/Service-Authentication-Collection.json`
- **Docs**: `POSTMAN_TESTING_GUIDE.md`
- **API Reference**: `USER_CREATION_API_GUIDE.md`

**Happy Testing! 🚀**
