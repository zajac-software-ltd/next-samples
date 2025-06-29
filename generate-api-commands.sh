#!/bin/bash

# Generate ready-to-use cURL commands for user creation and invitations
# Run this script to get copy-paste commands

BASE_URL="http://localhost:3000"
echo "🚀 API Commands Generator"
echo "========================"
echo "Copy and paste these commands in your terminal:"
echo ""

# Generate a fresh token first
echo "📝 Step 1: Generate JWT Token"
echo "------------------------------"
cat << 'EOF'
curl -X POST http://localhost:3000/api/dev/generate-token \
  -H "Content-Type: application/json" \
  -d '{
    "issuer": "manual-test",
    "scopes": ["user:read", "user:create", "invite:send"],
    "expiresIn": "2h"
  }' | jq '.'
EOF

echo ""
echo "💡 Copy the token from the response above, then use it in the commands below:"
echo ""

# Generate current timestamp for unique emails
TIMESTAMP=$(date +%s)

echo "📧 Step 2: Create User with Invitation Link"
echo "-------------------------------------------"
cat << EOF
curl -X POST http://localhost:3000/api/service/invites \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Invited User $TIMESTAMP",
    "email": "invited$TIMESTAMP@example.com",
    "role": "USER",
    "expiresInHours": 48
  }' | jq '.'
EOF

echo ""
echo "👤 Step 3: Create Active User (No Invitation)"
echo "---------------------------------------------"
cat << EOF
curl -X POST http://localhost:3000/api/service/users \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Active User $TIMESTAMP",
    "email": "active$TIMESTAMP@example.com",
    "role": "USER",
    "phone": "+1234567890"
  }' | jq '.'
EOF

echo ""
echo "👑 Step 4: Create Admin with Invitation"
echo "---------------------------------------"
cat << EOF
curl -X POST http://localhost:3000/api/service/invites \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Admin User $TIMESTAMP",
    "email": "admin$TIMESTAMP@example.com",
    "role": "ADMIN",
    "expiresInHours": 72
  }' | jq '.'
EOF

echo ""
echo "🔍 Step 5: Check Invitation Status"
echo "----------------------------------"
cat << EOF
# Check by email
curl "http://localhost:3000/api/service/invites?email=invited$TIMESTAMP@example.com" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'

# Check by token (replace TOKEN_FROM_INVITATION_RESPONSE)
curl "http://localhost:3000/api/service/invites?token=TOKEN_FROM_INVITATION_RESPONSE" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'
EOF

echo ""
echo "📊 Step 6: List All Users"
echo "------------------------"
cat << 'EOF'
curl "http://localhost:3000/api/service/users?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'
EOF

echo ""
echo "🎯 Quick Test Sequence"
echo "======================"
echo "1. Run the token generation command"
echo "2. Replace 'YOUR_TOKEN_HERE' in the other commands with the actual token"
echo "3. Run the invitation/user creation commands"
echo "4. Copy the claimUrl from the invitation response"
echo "5. Visit the claimUrl in a browser to test the user setup flow"
echo ""
echo "📧 The invitation URLs will look like:"
echo "   http://localhost:3000/auth/claim?token=abc123..."
echo ""
echo "🔗 You can also test in Postman using the pre-configured collection!"

# Let's also generate a real token for immediate use
echo ""
echo "🎁 Bonus: Here's a fresh token for immediate testing:"
echo "===================================================="

TOKEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/dev/generate-token" \
  -H "Content-Type: application/json" \
  -d '{
    "issuer": "quick-test",
    "scopes": ["user:read", "user:create", "invite:send"],
    "expiresIn": "2h"
  }')

FRESH_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token' 2>/dev/null || echo "Failed to generate")

if [ "$FRESH_TOKEN" != "null" ] && [ "$FRESH_TOKEN" != "Failed to generate" ]; then
  echo "Token: $FRESH_TOKEN"
  echo ""
  echo "📋 Ready-to-use command with fresh token:"
  echo "curl -X POST http://localhost:3000/api/service/invites \\"
  echo "  -H \"Authorization: Bearer $FRESH_TOKEN\" \\"
  echo "  -H \"Content-Type: application/json\" \\"
  echo "  -d '{"
  echo "    \"name\": \"Test User $(date +%s)\","
  echo "    \"email\": \"test$(date +%s)@example.com\","
  echo "    \"role\": \"USER\","
  echo "    \"expiresInHours\": 24"
  echo "  }' | jq '.'"
else
  echo "❌ Could not generate fresh token. Make sure your server is running on localhost:3000"
fi
