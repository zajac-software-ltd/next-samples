# 🚀 **POSTMAN TESTING GUIDE - User Creation & Invitations**

## **Quick Start Checklist**

✅ **Prerequisites:**
- [ ] Next.js server running on `http://localhost:3000`
- [ ] Postman installed
- [ ] Collection imported from `postman/Service-Authentication-Collection.json`

---

## **🔧 SETUP (Do Once)**

### **1. Import Collection**
1. Open Postman
2. Click **"Import"** button (top left)
3. Choose **"Upload Files"**
4. Select: `/postman/Service-Authentication-Collection.json`
5. Click **"Import"**

### **2. Create Environment**
1. Click **gear icon** ⚙️ (top right)
2. Click **"Add"** to create new environment
3. **Name**: `Local API Testing`
4. **Add Variable**:
   - **Variable**: `baseUrl`
   - **Initial Value**: `http://localhost:3000`
   - **Current Value**: `http://localhost:3000`
5. **Save** and **Select** this environment

---

## **🎯 TESTING FLOW (Step by Step)**

### **Step 1: Generate JWT Token**

**📍 Location:** `Service Authentication API` → `🔑 Token Management` → `Generate JWT Token`

**📝 What to do:**
1. Select the request
2. Check the **Body** (should be):
```json
{
  "issuer": "postman-test",
  "scopes": ["user:read", "user:create", "invite:send"],
  "expiresIn": "24h"
}
```
3. Click **"Send"**

**✅ Expected Result:**
- Status: `200 OK`
- Token automatically saved to `{{jwtToken}}` variable
- Response shows token, scopes, and expiration

---

### **Step 2: Create User with Invitation**

**📍 Location:** `Service Authentication API` → `📝 Standard JWT Auth` → `Send Invitation`

**📝 What to do:**
1. Select the request
2. **Headers** should show:
   - `Authorization: Bearer {{jwtToken}}`
   - `Content-Type: application/json`
3. **Body** should be:
```json
{
  "name": "Invited User",
  "email": "invite-{{$timestamp}}@example.com",
  "role": "USER",
  "expiresInHours": 24
}
```
4. Click **"Send"**

**✅ Expected Result:**
- Status: `201 Created`
- Response contains:
  - `user` object with ID, name, email
  - `invitation` object with `claimUrl` and expiration
- **Copy the `claimUrl`** - you'll need it!

---

### **Step 3: Check Invitation Status**

**📝 Manual Request:**
1. Create **new GET request**
2. **URL**: `{{baseUrl}}/api/service/invites?email=YOUR_TEST_EMAIL`
3. **Headers**: `Authorization: Bearer {{jwtToken}}`
4. Click **"Send"**

**✅ Expected Result:**
- Status: `200 OK`
- Shows invitation status: `"pending"`
- `isClaimed: false`
- `isExpired: false`

---

### **Step 4: Create Active User (No Invitation)**

**📍 Location:** `Service Authentication API` → `📝 Standard JWT Auth` → `Create User (Standard)`

**📝 What to do:**
1. Select the request
2. **Body** should be:
```json
{
  "name": "Standard Auth User",
  "email": "standard-{{$timestamp}}@example.com",
  "role": "USER"
}
```
3. Click **"Send"**

**✅ Expected Result:**
- Status: `201 Created`
- User is immediately active (no invitation needed)
- `emailVerified` is set to current timestamp

---

### **Step 5: List All Users**

**📍 Location:** `Service Authentication API` → `📝 Standard JWT Auth` → `Get Users (Standard)`

**📝 What to do:**
1. Select the request
2. **URL** should be: `{{baseUrl}}/api/service/users?page=1&limit=5`
3. Click **"Send"**

**✅ Expected Result:**
- Status: `200 OK`
- List of users with pagination info
- You should see your newly created users

---

## **🧪 ADVANCED TESTING**

### **Test Different Scenarios:**

#### **Create Admin User**
```json
{
  "name": "System Admin",
  "email": "admin-{{$timestamp}}@example.com",
  "role": "ADMIN",
  "expiresInHours": 72
}
```

#### **Test Short Expiration**
```json
{
  "name": "Quick Expire Test",
  "email": "expire-{{$timestamp}}@example.com",
  "role": "USER",
  "expiresInHours": 0.1
}
```

#### **Test Error Cases**
1. **Invalid Token**: Change Authorization header to `Bearer invalid-token`
2. **Missing Scopes**: Generate token with only `["user:read"]`
3. **Duplicate Email**: Create user with same email twice

---

## **🔗 TEST THE COMPLETE INVITATION FLOW**

### **After Creating an Invitation:**

1. **Copy the `claimUrl`** from the invitation response
2. **Open in browser** (should look like):
   ```
   http://localhost:3000/auth/claim?token=abc123def456...
   ```
3. **Set up password** in the browser
4. **Go back to Postman** and check invitation status again
5. **Status should change** to `"claimed"`

---

## **💾 POSTMAN ENVIRONMENT VARIABLES**

**Auto-saved by collection:**
- `{{jwtToken}}` - Current JWT token
- `{{lastInviteUrl}}` - Last created invitation URL
- `{{lastInviteEmail}}` - Last invited user's email

**Built-in Postman variables:**
- `{{$timestamp}}` - Current Unix timestamp
- `{{$randomEmail}}` - Random email address
- `{{$randomFullName}}` - Random full name

---

## **🚨 TROUBLESHOOTING**

| Problem | Solution |
|---------|----------|
| **401 Unauthorized** | Generate new JWT token |
| **403 Forbidden** | Check token has required scopes |
| **404 Not Found** | Verify server is running on localhost:3000 |
| **409 Conflict** | Use different email (add {{$timestamp}}) |
| **Variables not working** | Ensure environment is selected |

---

## **✅ QUICK SUCCESS CHECK**

**If everything works, you should see:**

1. ✅ Token generation returns 200 with JWT
2. ✅ User invitation returns 201 with claim URL
3. ✅ Invitation status shows "pending"
4. ✅ Active user creation returns 201
5. ✅ User list shows your created users
6. ✅ Claim URL opens in browser and allows password setup

---

## **🎉 YOU'RE READY!**

Your API is working correctly if:
- **Tokens generate successfully**
- **Users create with and without invitations**
- **Invitation URLs work in browser**
- **Status checks return correct information**
- **All responses match expected format**

**Next Steps:**
- Test with your frontend application
- Integrate with email service for sending invitations
- Add user management UI
- Set up production environment

**Happy Testing! 🚀**
