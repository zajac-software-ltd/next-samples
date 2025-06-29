/**
 * Example of how your main app would use enhanced service authentication
 * This simulates the client-side code that would run in your main application
 */

import dotenv from 'dotenv';
import { ServiceAuthClient } from '../lib/enhanced-service-auth';
import { generateServiceToken, SERVICE_SCOPES } from '../lib/service-auth';

// Load environment variables
dotenv.config();

async function demonstrateEnhancedAuth() {
  console.log('🔐 Enhanced Service Authentication Demo\n');

  // Step 1: Get credentials (in production, these would be stored securely)
  const clientId = 'main-app';
  const plainSecret = process.env.MAIN_APP_SERVICE_SECRET;
  
  if (!plainSecret) {
    console.error('❌ MAIN_APP_SERVICE_SECRET not found in environment');
    return;
  }

  // Step 2: Generate JWT token (would be done once and stored/rotated)
  const jwtToken = generateServiceToken(
    clientId, 
    [SERVICE_SCOPES.USER_READ, SERVICE_SCOPES.USER_CREATE], 
    '24h'
  );

  console.log('✅ Generated JWT token');
  console.log('✅ Using plain secret for enhanced auth');
  console.log('');

  // Step 3: Create service auth client
  const authClient = new ServiceAuthClient(clientId, plainSecret);

  // Step 4: Make API request with enhanced authentication
  const method = 'GET';
  const path = '/api/service/secure/users';
  const url = `http://localhost:3000${path}`;

  console.log(`📡 Making ${method} request to ${path}`);

  try {
    // Generate enhanced auth headers
    const headers = authClient.createHeaders(jwtToken, method, path);
    
    console.log('🔑 Enhanced auth headers:');
    console.log('  X-Client-ID:', headers['X-Client-ID']);
    console.log('  X-Auth-Timestamp:', headers['X-Auth-Timestamp']);
    console.log('  X-Auth-Nonce:', headers['X-Auth-Nonce']);
    console.log('  X-Auth-Hash:', headers['X-Auth-Hash'].substring(0, 16) + '...');
    console.log('');

    // Make the request
    const response = await fetch(url, {
      method,
      headers,
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Enhanced authentication successful!');
      console.log('📊 Response:', {
        usersCount: result.users?.length || 0,
        authMethod: result.meta?.authMethod,
        clientId: result.meta?.clientId,
      });
    } else {
      console.log('❌ Request failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Request error:', error);
  }
}

// Example of creating a user with enhanced auth
async function createUserExample() {
  console.log('\n🆕 Creating User with Enhanced Auth\n');

  const clientId = 'main-app';
  const plainSecret = process.env.MAIN_APP_SERVICE_SECRET;
  
  if (!plainSecret) {
    console.error('❌ MAIN_APP_SERVICE_SECRET not found');
    return;
  }

  const jwtToken = generateServiceToken(
    clientId, 
    [SERVICE_SCOPES.USER_CREATE], 
    '24h'
  );

  const authClient = new ServiceAuthClient(clientId, plainSecret);
  const method = 'POST';
  const path = '/api/service/secure/users';
  const url = `http://localhost:3000${path}`;

  const userData = {
    name: 'Enhanced Auth User',
    email: `test-enhanced-${Date.now()}@example.com`,
    role: 'USER'
  };

  try {
    const headers = authClient.createHeaders(jwtToken, method, path);
    
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ User created successfully with enhanced auth!');
      console.log('👤 User:', {
        id: result.user.id,
        email: result.user.email,
        authMethod: result.meta.authMethod,
      });
    } else {
      console.log('❌ User creation failed:', result.error);
    }

  } catch (error) {
    console.error('❌ User creation error:', error);
  }
}

// Run the demo
async function main() {
  await demonstrateEnhancedAuth();
  await createUserExample();
  
  console.log('\n🔒 Security Benefits:');
  console.log('  ✓ JWT token proves authorization & scopes');
  console.log('  ✓ Hash proves possession of shared secret');
  console.log('  ✓ Timestamp prevents replay attacks');
  console.log('  ✓ Nonce adds randomness');
  console.log('  ✓ Method/path binding prevents request reuse');
  console.log('  ✓ Stolen JWT alone is useless without secret');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { demonstrateEnhancedAuth, createUserExample };
