#!/usr/bin/env node

/**
 * Demo script showing how to create users and generate invite links
 * This demonstrates the complete user onboarding flow via API
 */

const BASE_URL = 'http://localhost:3000';

async function demonstrateUserCreationFlow() {
  console.log('🚀 User Creation & Invitation Demo');
  console.log('===================================\n');

  try {
    // Step 1: Generate JWT token with required scopes
    console.log('Step 1: Generating JWT token with user:create and invite:send scopes...');
    const tokenResponse = await fetch(`${BASE_URL}/api/dev/generate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issuer: 'user-onboarding-demo',
        scopes: ['user:read', 'user:create', 'invite:send'],
        expiresIn: '2h'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token generation failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const jwtToken = tokenData.token;
    
    console.log('✅ Token generated successfully');
    console.log(`   Scopes: ${tokenData.scopes.join(', ')}`);
    console.log(`   Expires: ${tokenData.expiresAt}\n`);

    // Method 1: Create a regular user (already activated)
    console.log('📝 Method 1: Creating a regular user (immediately active)...');
    
    const timestamp = Date.now();
    const regularUser = {
      name: `Active User ${timestamp}`,
      email: `active${timestamp}@example.com`,
      role: 'USER'
    };

    const createUserResponse = await fetch(`${BASE_URL}/api/service/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(regularUser)
    });

    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      console.log(`❌ Regular user creation failed: ${createUserResponse.status} - ${errorText}`);
    } else {
      const createdUser = await createUserResponse.json();
      console.log('✅ Regular user created successfully');
      console.log(`   ID: ${createdUser.user.id}`);
      console.log(`   Name: ${createdUser.user.name}`);
      console.log(`   Email: ${createdUser.user.email}`);
      console.log(`   Status: Active (no password setup required)\n`);
    }

    // Method 2: Create user with invitation (requires password setup)
    console.log('📧 Method 2: Creating user with invitation link...');
    
    const inviteUser = {
      name: `Invited User ${timestamp + 1}`,
      email: `invited${timestamp + 1}@example.com`,
      role: 'USER',
      expiresInHours: 48 // 2 days to claim
    };

    const inviteResponse = await fetch(`${BASE_URL}/api/service/invites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(inviteUser)
    });

    if (!inviteResponse.ok) {
      const errorText = await inviteResponse.text();
      console.log(`❌ Invitation failed: ${inviteResponse.status} - ${errorText}`);
    } else {
      const inviteResult = await inviteResponse.json();
      console.log('✅ Invitation created successfully');
      console.log(`   User ID: ${inviteResult.user.id}`);
      console.log(`   Name: ${inviteResult.user.name}`);
      console.log(`   Email: ${inviteResult.user.email}`);
      console.log(`   📧 Invite URL: ${inviteResult.invitation.claimUrl}`);
      console.log(`   ⏰ Expires: ${inviteResult.invitation.expiresAt}`);
      console.log(`   🔑 Claim Token: ${inviteResult.invitation.claimToken}\n`);

      // Save the claim token for status checking
      const claimToken = inviteResult.invitation.claimToken;
      const userEmail = inviteResult.user.email;

      // Step 3: Check invitation status
      console.log('📋 Step 3: Checking invitation status...');
      
      const statusResponse = await fetch(
        `${BASE_URL}/api/service/invites?email=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('✅ Invitation status retrieved');
        console.log(`   Status: ${statusData.invitation.status}`);
        console.log(`   Is Claimed: ${statusData.invitation.isClaimed}`);
        console.log(`   Is Expired: ${statusData.invitation.isExpired}`);
        console.log(`   Expires At: ${statusData.invitation.expiresAt}\n`);
      }

      // Step 4: Show how to check by token
      console.log('🔍 Step 4: Checking invitation by token...');
      
      const tokenStatusResponse = await fetch(
        `${BASE_URL}/api/service/invites?token=${claimToken}`,
        {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        }
      );

      if (tokenStatusResponse.ok) {
        const tokenStatusData = await tokenStatusResponse.json();
        console.log('✅ Token status retrieved');
        console.log(`   User: ${tokenStatusData.user.name} (${tokenStatusData.user.email})`);
        console.log(`   Status: ${tokenStatusData.invitation.status}\n`);
      }
    }

    // Step 5: Create admin user with invitation
    console.log('👑 Step 5: Creating admin user with invitation...');
    
    const adminInvite = {
      name: `Admin User ${timestamp + 2}`,
      email: `admin${timestamp + 2}@example.com`,
      role: 'ADMIN',
      expiresInHours: 72 // 3 days for admin setup
    };

    const adminInviteResponse = await fetch(`${BASE_URL}/api/service/invites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adminInvite)
    });

    if (adminInviteResponse.ok) {
      const adminResult = await adminInviteResponse.json();
      console.log('✅ Admin invitation created successfully');
      console.log(`   Admin ID: ${adminResult.user.id}`);
      console.log(`   Name: ${adminResult.user.name}`);
      console.log(`   Email: ${adminResult.user.email}`);
      console.log(`   Role: ${adminResult.user.role}`);
      console.log(`   📧 Admin Invite URL: ${adminResult.invitation.claimUrl}\n`);
    }

    // Step 6: List all users to see what we created
    console.log('📊 Step 6: Listing all users to see created accounts...');
    
    const usersResponse = await fetch(`${BASE_URL}/api/service/users?limit=20`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users list retrieved');
      console.log(`   Total users: ${usersData.pagination.total}`);
      
      // Show recently created users
      const recentUsers = usersData.users.slice(0, 5);
      console.log('\n   Recent users:');
      recentUsers.forEach((user, index) => {
        const hasPassword = user.password ? '🔒' : '📧';
        const status = user.password ? 'Active' : 'Pending Setup';
        console.log(`   ${index + 1}. ${hasPassword} ${user.name} (${user.email}) - ${user.role} - ${status}`);
      });
    }

    console.log('\n🎉 User creation and invitation demo completed!');
    console.log('\n💡 Key Points:');
    console.log('   • POST /api/service/users - Creates immediately active users');
    console.log('   • POST /api/service/invites - Creates users with invitation links');
    console.log('   • GET /api/service/invites?email=... - Check invitation status');
    console.log('   • Invited users must visit the claim URL to set their password');
    console.log('   • Regular created users are immediately active');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demonstration
demonstrateUserCreationFlow();
