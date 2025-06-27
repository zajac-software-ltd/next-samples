# Account Invitation & Claiming System

This document describes the account invitation and claiming flow implemented in the Next.js authentication system.

## Overview

The system allows administrators to create user accounts and provide access via secure claim links. Users can then claim their accounts by setting a password, after which login via link is disabled.

## Flow Diagram

```
Admin → Create Invitation → Generate Claim Link → User Claims Account → Password Login Only
```

## Features

### 1. Admin Invitation Creation
- **Endpoint**: `POST /api/admin/invite`
- **Access**: Admin only
- **Functionality**: Creates a user account with a secure claim token
- **Expiration**: Claim links expire after 7 days

### 2. Account Claiming
- **Endpoint**: `POST /api/auth/claim`
- **Validation**: `GET /api/auth/claim?token=...`
- **Functionality**: Users set their password and claim their account
- **Security**: Single-use tokens that are cleared after claiming

### 3. Link-based Access (Pre-claim only)
- **Endpoint**: `GET /api/auth/link-login?token=...`
- **Functionality**: Redirects to claim page for unclaimed accounts
- **Restriction**: Disabled after account is claimed

## Database Schema

### User Model Fields
```prisma
model User {
  // ... existing fields ...
  
  // Account claiming fields
  claimToken        String?   @unique
  claimTokenExpires DateTime?
  isClaimed         Boolean   @default(false)
}
```

## API Endpoints

### Create Invitation (Admin)
```typescript
POST /api/admin/invite
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER" // or "ADMIN"
}

Response:
{
  "message": "User invitation created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  },
  "claimLink": "http://localhost:3000/auth/claim?token=abc123...",
  "expiresAt": "2025-07-03T14:57:51.517Z"
}
```

### Validate Claim Token
```typescript
GET /api/auth/claim?token=abc123...

Response:
{
  "valid": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "claimTokenExpires": "2025-07-03T14:57:51.517Z"
  }
}
```

### Claim Account
```typescript
POST /api/auth/claim
Content-Type: application/json

{
  "token": "abc123...",
  "password": "newpassword123"
}

Response:
{
  "message": "Account claimed successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

## UI Components

### Admin Interface
- **Location**: `/app/admin/users/page.tsx`
- **Features**:
  - "Invite User" button
  - User list with claim status indicators
  - Status badges: Active (claimed), Pending (unclaimed), Expired

### Invitation Modal
- **Component**: `InviteUserModal`
- **Features**:
  - User creation form
  - Claim link generation
  - Copy-to-clipboard functionality

### Claim Page
- **Location**: `/app/auth/claim/page.tsx`
- **Features**:
  - Token validation
  - Password setup form
  - Account information display
  - Success/error handling

## Security Features

### Token Security
- **Generation**: Cryptographically secure random tokens (32 bytes hex)
- **Expiration**: 7-day expiration window
- **Single-use**: Tokens are cleared after successful claiming
- **Uniqueness**: Database unique constraint on claim tokens

### Access Control
- **Admin Only**: Only admins can create invitations
- **Token Validation**: Comprehensive validation of claim tokens
- **Expiration Handling**: Expired tokens are rejected
- **Post-claim Security**: Claim tokens are nullified after use

## User Experience

### Admin Workflow
1. Navigate to Admin → Users
2. Click "Invite User"
3. Fill in user details (name, email, role)
4. Copy generated claim link
5. Share link with user (email, chat, etc.)

### User Workflow
1. Receive claim link from admin
2. Click link to open claim page
3. View account details (name, email, role)
4. Set password (minimum 6 characters)
5. Submit to claim account
6. Redirect to sign-in page
7. Use email/password for future logins

## Status Indicators

### In Admin Interface
- **🟢 Active**: Account has been claimed and password is set
- **🟡 Pending**: Invitation sent, waiting for user to claim
- **🔴 Expired**: Claim link has expired, new invitation needed

## Error Handling

### Common Error Scenarios
- **Invalid Token**: Token doesn't exist or malformed
- **Expired Token**: Token exists but past expiration date
- **Already Claimed**: Account has already been claimed
- **Server Errors**: Database or network issues

### Error Messages
- User-friendly error messages in UI
- Detailed error logs for debugging
- Graceful fallback to sign-in page

## Testing

### Automated Tests
- Token generation and validation
- Account claiming process
- Expiration handling
- Password authentication
- Security edge cases

### Manual Testing Checklist
- [ ] Admin can create invitations
- [ ] Claim links work correctly
- [ ] Password setup functions
- [ ] Expired tokens are rejected
- [ ] Claimed accounts require password login
- [ ] Status indicators are accurate

## Configuration

### Environment Variables
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

### Token Settings
- **Expiration**: 7 days (configurable in code)
- **Length**: 64 characters (32 bytes hex)
- **Algorithm**: Node.js crypto.randomBytes()

## Deployment Considerations

### Production Setup
- Ensure NEXTAUTH_URL points to production domain
- Use strong NEXTAUTH_SECRET
- Configure email sending for link distribution
- Set up proper error monitoring
- Regular cleanup of expired tokens

### Security Checklist
- [ ] HTTPS enabled for production
- [ ] Secure token generation
- [ ] Proper token cleanup
- [ ] Admin access controls
- [ ] Rate limiting on invite endpoints
- [ ] Email validation for invitations

## Future Enhancements

### Potential Improvements
- Email sending integration for automatic link delivery
- Bulk user invitation functionality
- Invitation template customization
- Audit logging for invitation activities
- Invitation link regeneration
- Custom expiration periods per invitation
- Role-based invitation permissions
