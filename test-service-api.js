#!/usr/bin/env node

/**
 * Quick test script to verify service API endpoints
 * This demonstrates the same flow you'd use in Postman
 */

const BASE_URL = 'http://localhost:3000';

async function testServiceAPI() {
  console.log('🧪 Testing Service API Endpoints\n');

  try {
    // Step 1: Generate a JWT token
    console.log('Step 1: Generating JWT token...');
    const tokenResponse = await fetch(`${BASE_URL}/api/dev/generate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issuer: 'test-script',
        scopes: ['user:read', 'user:create', 'invite:send'],
        expiresIn: '1h'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token generation failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token generated successfully');
    console.log(`   Issuer: ${tokenData.issuer}`);
    console.log(`   Scopes: ${tokenData.scopes.join(', ')}`);
    console.log(`   Expires: ${tokenData.expiresAt}`);
    console.log(`   Token: ${tokenData.token.substring(0, 50)}...`);

    const jwtToken = tokenData.token;

    // Step 2: Test getting users
    console.log('\nStep 2: Testing GET /api/service/users...');
    const usersResponse = await fetch(`${BASE_URL}/api/service/users?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.log(`❌ Users request failed: ${usersResponse.status} - ${errorText}`);
    } else {
      const usersData = await usersResponse.json();
      console.log('✅ Users retrieved successfully');
      console.log(`   Total users: ${usersData.pagination.total}`);
      console.log(`   Current page: ${usersData.pagination.page}`);
      console.log(`   Users returned: ${usersData.users.length}`);
      console.log(`   Total pages: ${usersData.pagination.pages}`);
    }

    // Step 3: Test creating a user
    console.log('\nStep 3: Testing POST /api/service/users...');
    const newUser = {
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      role: 'USER'
    };

    const createResponse = await fetch(`${BASE_URL}/api/service/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUser)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log(`❌ User creation failed: ${createResponse.status} - ${errorText}`);
    } else {
      const responseData = await createResponse.json();
      console.log('✅ User created successfully');
      console.log(`   ID: ${responseData.user.id}`);
      console.log(`   Name: ${responseData.user.name}`);
      console.log(`   Email: ${responseData.user.email}`);
      console.log(`   Created by: ${responseData.meta.createdBy}`);
    }

    // Step 4: Test with invalid token
    console.log('\nStep 4: Testing with invalid token...');
    const invalidResponse = await fetch(`${BASE_URL}/api/service/users`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    if (invalidResponse.status === 401) {
      console.log('✅ Invalid token correctly rejected (401)');
    } else {
      console.log(`❌ Expected 401, got ${invalidResponse.status}`);
    }

    // Step 5: Test without token
    console.log('\nStep 5: Testing without authorization header...');
    const noAuthResponse = await fetch(`${BASE_URL}/api/service/users`);

    if (noAuthResponse.status === 401) {
      console.log('✅ Missing token correctly rejected (401)');
    } else {
      console.log(`❌ Expected 401, got ${noAuthResponse.status}`);
    }

    console.log('\n🎉 Service API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testServiceAPI();
