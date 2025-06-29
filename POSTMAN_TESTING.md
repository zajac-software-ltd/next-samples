# Testing Service Authentication in Postman

This guide shows how to test both standard JWT authentication and enhanced authentication in Postman.

## 🔧 Setup

### 1. Environment Variables
Create a new Postman environment with these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:3000` | Your API base URL |
| `jwtToken` | `{{generated_token}}` | Will be set after token generation |
| `clientId` | `main-app` | Service client identifier |
| `plainSecret` | `{{your_secret}}` | From your .env file |

### 2. Get Your Service Secret
First, get the plain secret from your environment:

```bash
# In your terminal
grep MAIN_APP_SERVICE_SECRET .env
```

Copy this value and set it as the `plainSecret` variable in Postman.

## 🎯 Method 1: Standard JWT Authentication

### Step 1: Generate JWT Token
Create a new request:

**Method:** GET  
**URL:** `{{baseUrl}}/api/generate-token` (we'll create this endpoint)

Or generate manually in terminal:
```bash
npx tsx scripts/generate-service-token.ts main-app "user:read,user:create,invite:send" 24h
```

Copy the token and set it as `jwtToken` in your environment.

### Step 2: Test Standard Endpoints

#### Get Users (Standard JWT)
**Method:** GET  
**URL:** `{{baseUrl}}/api/service/users`

**Headers:**
```
Authorization: Bearer {{jwtToken}}
Content-Type: application/json
```

#### Create User (Standard JWT)
**Method:** POST  
**URL:** `{{baseUrl}}/api/service/users`

**Headers:**
```
Authorization: Bearer {{jwtToken}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Test User",
  "email": "test-{{$timestamp}}@example.com",
  "role": "USER"
}
```

## 🔐 Method 2: Enhanced Authentication

For enhanced endpoints, you need to generate the hash manually or use the pre-request script.

### Pre-Request Script for Enhanced Auth

Add this to the **Pre-request Script** tab of your enhanced auth requests:

```javascript
// Enhanced Authentication Pre-request Script
const crypto = require('crypto-js');

// Get environment variables
const plainSecret = pm.environment.get('plainSecret');
const clientId = pm.environment.get('clientId');

if (!plainSecret) {
    throw new Error('plainSecret not set in environment');
}

// Generate timestamp and nonce
const timestamp = Date.now();
const nonce = crypto.lib.WordArray.random(16).toString();

// Get request details
const method = pm.request.method;
const url = new URL(pm.request.url.toString());
const path = url.pathname;

// Generate hash: secret + timestamp + nonce + method + path
const payload = `${plainSecret}:${timestamp}:${nonce}:${method}:${path}`;
const hash = crypto.SHA256(payload).toString();

// Set headers
pm.request.headers.add({
    key: 'X-Client-ID',
    value: clientId
});

pm.request.headers.add({
    key: 'X-Auth-Timestamp',
    value: timestamp.toString()
});

pm.request.headers.add({
    key: 'X-Auth-Nonce',
    value: nonce
});

pm.request.headers.add({
    key: 'X-Auth-Hash',
    value: hash
});

// Log for debugging
console.log('Enhanced Auth Generated:');
console.log('Timestamp:', timestamp);
console.log('Nonce:', nonce);
console.log('Method:', method);
console.log('Path:', path);
console.log('Payload:', payload);
console.log('Hash:', hash);
```

### Step 1: Test Enhanced Get Users

**Method:** GET  
**URL:** `{{baseUrl}}/api/service/secure/users`

**Headers:** (these will be auto-added by the pre-request script)
```
Authorization: Bearer {{jwtToken}}
Content-Type: application/json
```

### Step 2: Test Enhanced Create User

**Method:** POST  
**URL:** `{{baseUrl}}/api/service/secure/users`

**Headers:** (auto-added by script)
```
Authorization: Bearer {{jwtToken}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Enhanced Auth User",
  "email": "enhanced-{{$timestamp}}@example.com",
  "role": "USER"
}
```

## 🧪 Test Scenarios

### Scenario 1: Valid Request
- Use valid JWT token
- Include all enhanced auth headers (via pre-request script)
- Should return 200 with data

### Scenario 2: Missing JWT
- Remove Authorization header
- Should return 401 "Missing or invalid authorization header"

### Scenario 3: Invalid JWT
- Use expired or malformed JWT
- Should return 401 "Invalid JWT token"

### Scenario 4: Missing Enhanced Headers
- Comment out the pre-request script
- Should return 401 "Missing enhanced authentication headers"

### Scenario 5: Invalid Hash
- Modify the plainSecret in environment to wrong value
- Should return 401 "Enhanced authentication failed"

### Scenario 6: Timestamp Too Old
- In pre-request script, change timestamp to: `Date.now() - (10 * 60 * 1000)` (10 minutes ago)
- Should return 401 "Request timestamp too old"

## 📊 Collection Structure

Create a Postman collection with this structure:

```
Service Authentication Tests
├── 🔑 Token Management
│   └── Generate JWT Token
├── 📝 Standard JWT Auth
│   ├── Get Users
│   ├── Create User
│   ├── Send Invitation
│   └── Create Temp Session
└── 🔐 Enhanced Auth
    ├── Get Users (Enhanced)
    ├── Create User (Enhanced)
    └── Test Invalid Scenarios
        ├── Missing JWT
        ├── Invalid Hash
        ├── Old Timestamp
        └── Wrong Client ID
```

## 🚀 Quick Start Collection

Here's a complete Postman collection JSON you can import:

```json
{
    "info": {
        "name": "Service Authentication API",
        "description": "Test both standard JWT and enhanced authentication"
    },
    "variable": [
        {
            "key": "baseUrl",
            "value": "http://localhost:3000"
        },
        {
            "key": "jwtToken",
            "value": ""
        },
        {
            "key": "clientId",
            "value": "main-app"
        },
        {
            "key": "plainSecret",
            "value": "YOUR_SECRET_HERE"
        }
    ],
    "item": [
        {
            "name": "Standard - Get Users",
            "request": {
                "method": "GET",
                "header": [
                    {
                        "key": "Authorization",
                        "value": "Bearer {{jwtToken}}"
                    }
                ],
                "url": "{{baseUrl}}/api/service/users"
            }
        },
        {
            "name": "Enhanced - Get Users",
            "event": [
                {
                    "listen": "prerequest",
                    "script": {
                        "exec": [
                            "// Enhanced Auth Pre-request Script",
                            "const crypto = require('crypto-js');",
                            "const plainSecret = pm.environment.get('plainSecret');",
                            "const clientId = pm.environment.get('clientId');",
                            "",
                            "const timestamp = Date.now();",
                            "const nonce = crypto.lib.WordArray.random(16).toString();",
                            "const method = pm.request.method;",
                            "const url = new URL(pm.request.url.toString());",
                            "const path = url.pathname;",
                            "",
                            "const payload = `${plainSecret}:${timestamp}:${nonce}:${method}:${path}`;",
                            "const hash = crypto.SHA256(payload).toString();",
                            "",
                            "pm.request.headers.add({ key: 'X-Client-ID', value: clientId });",
                            "pm.request.headers.add({ key: 'X-Auth-Timestamp', value: timestamp.toString() });",
                            "pm.request.headers.add({ key: 'X-Auth-Nonce', value: nonce });",
                            "pm.request.headers.add({ key: 'X-Auth-Hash', value: hash });"
                        ]
                    }
                }
            ],
            "request": {
                "method": "GET",
                "header": [
                    {
                        "key": "Authorization",
                        "value": "Bearer {{jwtToken}}"
                    }
                ],
                "url": "{{baseUrl}}/api/service/secure/users"
            }
        }
    ]
}
```

## 🔍 Debugging Tips

### Check Request Headers
In Postman Console (View → Show Postman Console), you'll see:
- Pre-request script logs
- Actual headers sent
- Response details

### Common Issues
1. **"Missing enhanced authentication headers"** → Pre-request script not running
2. **"Invalid authentication hash"** → Wrong secret or hash calculation error
3. **"Request timestamp too old"** → Clock sync issue or cached old timestamp
4. **"Unknown client"** → Wrong clientId in environment

### Verify Hash Manually
You can verify the hash generation in your terminal:
```bash
echo -n "your-secret:1703174400000:abc123:GET:/api/service/secure/users" | shasum -a 256
```

This should match the hash generated by Postman's pre-request script.
