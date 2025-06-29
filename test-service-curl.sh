#!/bin/bash

# Service API Testing with cURL
# Make sure your Next.js server is running on localhost:3000

BASE_URL="http://localhost:3000"

echo "🧪 Testing Service API with cURL"
echo "=================================="

# Step 1: Generate JWT Token
echo -e "\n📝 Step 1: Generating JWT Token..."
TOKEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/dev/generate-token" \
  -H "Content-Type: application/json" \
  -d '{
    "issuer": "curl-test",
    "scopes": ["user:read", "user:create", "invite:send"],
    "expiresIn": "1h"
  }')

# Extract token from response
JWT_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
  echo "❌ Failed to generate token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token generated successfully"
echo "Token: ${JWT_TOKEN:0:50}..."

# Step 2: Test GET Users
echo -e "\n📋 Step 2: Getting Users List..."
USERS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "${BASE_URL}/api/service/users?page=1&limit=3" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$USERS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
USERS_BODY=$(echo "$USERS_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Users retrieved successfully (Status: $HTTP_STATUS)"
  echo "Response preview:"
  echo "$USERS_BODY" | jq '.pagination, .users[0] // "No users found"' 2>/dev/null || echo "$USERS_BODY"
else
  echo "❌ Failed to get users (Status: $HTTP_STATUS)"
  echo "$USERS_BODY"
fi

# Step 3: Test POST Create User
echo -e "\n👤 Step 3: Creating New User..."
TIMESTAMP=$(date +%s)
CREATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BASE_URL}/api/service/users" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"cURL Test User $TIMESTAMP\",
    \"email\": \"curl-test-$TIMESTAMP@example.com\",
    \"role\": \"USER\"
  }")

HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ User created successfully (Status: $HTTP_STATUS)"
  echo "Response preview:"
  echo "$CREATE_BODY" | jq '.user | {id, name, email, role}' 2>/dev/null || echo "$CREATE_BODY"
else
  echo "❌ Failed to create user (Status: $HTTP_STATUS)"
  echo "$CREATE_BODY"
fi

# Step 4: Test Invalid Token
echo -e "\n🔒 Step 4: Testing Invalid Token..."
INVALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "${BASE_URL}/api/service/users" \
  -H "Authorization: Bearer invalid-token-123")

HTTP_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ Invalid token correctly rejected (Status: $HTTP_STATUS)"
else
  echo "❌ Expected 401, got $HTTP_STATUS"
fi

# Step 5: Test No Authorization Header
echo -e "\n🚫 Step 5: Testing No Authorization Header..."
NO_AUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "${BASE_URL}/api/service/users")

HTTP_STATUS=$(echo "$NO_AUTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ Missing authorization correctly rejected (Status: $HTTP_STATUS)"
else
  echo "❌ Expected 401, got $HTTP_STATUS"
fi

# Step 6: Test with Query Filters
echo -e "\n🔍 Step 6: Testing Query Filters..."
FILTER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "${BASE_URL}/api/service/users?role=USER&limit=2" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_STATUS=$(echo "$FILTER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
FILTER_BODY=$(echo "$FILTER_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Filtered query successful (Status: $HTTP_STATUS)"
  echo "Response preview:"
  echo "$FILTER_BODY" | jq '.pagination' 2>/dev/null || echo "Response received"
else
  echo "❌ Filter query failed (Status: $HTTP_STATUS)"
fi

echo -e "\n🎉 cURL testing completed!"
echo -e "\n💡 Tips:"
echo "- Save the JWT token for manual testing: $JWT_TOKEN"
echo "- Use 'jq' for better JSON formatting: curl ... | jq ."
echo "- Check the Postman collection for more advanced testing"
