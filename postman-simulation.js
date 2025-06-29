#!/usr/bin/env node

/**
 * Step-by-step Postman testing simulation
 * This shows exactly what happens in each Postman request
 */

const BASE_URL = 'http://localhost:3000';

async function simulatePostmanFlow() {
  console.log('📋 POSTMAN TESTING SIMULATION');
  console.log('============================');
  console.log('This shows exactly what each Postman request does:\n');

  try {
    // ========================================
    // STEP 1: Generate JWT Token (Postman Request #1)
    // ========================================
    console.log('🔑 STEP 1: Generate JWT Token');
    console.log('------------------------------');
    console.log('Request: POST {{baseUrl}}/api/dev/generate-token');
    console.log('Body:');
    console.log(JSON.stringify({
      "issuer": "postman-test",
      "scopes": ["user:read", "user:create", "invite:send"],
      "expiresIn": "24h"
    }, null, 2));
    
    const tokenResponse = await fetch(`${BASE_URL}/api/dev/generate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "issuer": "postman-test",
        "scopes": ["user:read", "user:create", "invite:send"],
        "expiresIn": "24h"
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token generation failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const jwtToken = tokenData.token;
    
    console.log('\n✅ Response:');
    console.log(JSON.stringify({
      token: tokenData.token.substring(0, 50) + '...',
      scopes: tokenData.scopes,
      expiresAt: tokenData.expiresAt
    }, null, 2));
    console.log('\n💾 Postman saves token to {{jwtToken}} environment variable');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================
    // STEP 2: Create User with Invitation (Postman Request #2)
    // ========================================
    console.log('📧 STEP 2: Create User with Invitation Link');
    console.log('--------------------------------------------');
    console.log('Request: POST {{baseUrl}}/api/service/invites');
    console.log('Headers:');
    console.log('  Authorization: Bearer {{jwtToken}}');
    console.log('  Content-Type: application/json');
    
    const inviteBody = {
      "name": "Postman Test User",
      "email": `postman-test-${Date.now()}@example.com`,
      "role": "USER",
      "expiresInHours": 48
    };
    
    console.log('\nBody:');
    console.log(JSON.stringify(inviteBody, null, 2));

    const inviteResponse = await fetch(`${BASE_URL}/api/service/invites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(inviteBody)
    });

    if (!inviteResponse.ok) {
      const errorText = await inviteResponse.text();
      throw new Error(`Invitation failed: ${inviteResponse.status} - ${errorText}`);
    }

    const inviteResult = await inviteResponse.json();
    
    console.log('\n✅ Response:');
    console.log(JSON.stringify({
      user: {
        id: inviteResult.user.id,
        name: inviteResult.user.name,
        email: inviteResult.user.email,
        role: inviteResult.user.role
      },
      invitation: {
        claimUrl: inviteResult.invitation.claimUrl,
        expiresAt: inviteResult.invitation.expiresAt
      }
    }, null, 2));
    
    console.log('\n💾 Postman can save these to environment variables:');
    console.log(`  {{lastInviteToken}} = "${inviteResult.invitation.claimToken}"`);
    console.log(`  {{lastInviteUrl}} = "${inviteResult.invitation.claimUrl}"`);
    console.log(`  {{lastInviteEmail}} = "${inviteResult.user.email}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Store for next steps
    const testEmail = inviteResult.user.email;
    const claimToken = inviteResult.invitation.claimToken;
    const claimUrl = inviteResult.invitation.claimUrl;

    // ========================================
    // STEP 3: Check Invitation Status (Postman Request #3)
    // ========================================
    console.log('🔍 STEP 3: Check Invitation Status');
    console.log('-----------------------------------');
    console.log(`Request: GET {{baseUrl}}/api/service/invites?email=${testEmail}`);
    console.log('Headers:');
    console.log('  Authorization: Bearer {{jwtToken}}');

    const statusResponse = await fetch(
      `${BASE_URL}/api/service/invites?email=${encodeURIComponent(testEmail)}`,
      {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      }
    );

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    
    console.log('\n✅ Response:');
    console.log(JSON.stringify({
      user: {
        name: statusData.user.name,
        email: statusData.user.email,
        role: statusData.user.role
      },
      invitation: {
        status: statusData.invitation.status,
        isExpired: statusData.invitation.isExpired,
        isClaimed: statusData.invitation.isClaimed,
        expiresAt: statusData.invitation.expiresAt
      }
    }, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================
    // STEP 4: Create Regular Active User (Postman Request #4)
    // ========================================
    console.log('👤 STEP 4: Create Active User (No Invitation)');
    console.log('----------------------------------------------');
    console.log('Request: POST {{baseUrl}}/api/service/users');
    console.log('Headers:');
    console.log('  Authorization: Bearer {{jwtToken}}');
    console.log('  Content-Type: application/json');
    
    const activeUserBody = {
      "name": "Active User",
      "email": `active-${Date.now()}@example.com`,
      "role": "USER",
      "phone": "+1234567890"
    };
    
    console.log('\nBody:');
    console.log(JSON.stringify(activeUserBody, null, 2));

    const activeUserResponse = await fetch(`${BASE_URL}/api/service/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activeUserBody)
    });

    if (!activeUserResponse.ok) {
      const errorText = await activeUserResponse.text();
      throw new Error(`User creation failed: ${activeUserResponse.status} - ${errorText}`);
    }

    const activeUserResult = await activeUserResponse.json();
    
    console.log('\n✅ Response:');
    console.log(JSON.stringify({
      user: {
        id: activeUserResult.user.id,
        name: activeUserResult.user.name,
        email: activeUserResult.user.email,
        role: activeUserResult.user.role,
        emailVerified: activeUserResult.user.emailVerified
      },
      meta: {
        createdBy: activeUserResult.meta.createdBy
      }
    }, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================
    // STEP 5: List Users (Postman Request #5)
    // ========================================
    console.log('📊 STEP 5: List All Users');
    console.log('-------------------------');
    console.log('Request: GET {{baseUrl}}/api/service/users?limit=5');
    console.log('Headers:');
    console.log('  Authorization: Bearer {{jwtToken}}');

    const usersResponse = await fetch(`${BASE_URL}/api/service/users?limit=5`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });

    if (!usersResponse.ok) {
      throw new Error(`Users list failed: ${usersResponse.status}`);
    }

    const usersData = await usersResponse.json();
    
    console.log('\n✅ Response:');
    console.log(JSON.stringify({
      users: usersData.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role
      })).slice(0, 3), // Show first 3
      pagination: usersData.pagination
    }, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('🎉 POSTMAN TESTING COMPLETE!');
    console.log('============================');
    console.log('📧 Invitation Link Created:');
    console.log(`   ${claimUrl}`);
    console.log('\n🔗 Test the complete flow:');
    console.log('   1. Copy the invitation URL above');
    console.log('   2. Open it in a browser');
    console.log('   3. Set up a password');
    console.log('   4. Check invitation status again (should show "claimed")');
    console.log('\n💡 In Postman:');
    console.log('   • All these requests are pre-configured in the collection');
    console.log('   • Environment variables automatically store tokens and URLs');
    console.log('   • Use {{$timestamp}} for unique emails');
    console.log('   • Test scripts validate responses and save data');

  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
  }
}

// Run the simulation
simulatePostmanFlow();
