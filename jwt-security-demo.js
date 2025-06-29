#!/usr/bin/env node

/**
 * Demonstration of JWT token verification security
 */

const jwt = require('jsonwebtoken');

// The real secret from .env
const REAL_SECRET = "VlD+sdQKZ5cTjYMJrBmLI76EeZRWWN/pY/Wxe1SFQr+RWky12xqHMNpFIIqRIuA3";
const FAKE_SECRET = "fake-secret-123";

console.log('🔐 JWT Token Verification Security Demo');
console.log('======================================\n');

// 1. Create a valid token with the real secret
console.log('1️⃣ Creating VALID token with real secret...');
const validToken = jwt.sign({
  iss: 'legitimate-service',
  aud: 'client-portal',
  scope: ['user:read'],
  exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
}, REAL_SECRET);

console.log('✅ Valid token created:', validToken.substring(0, 50) + '...\n');

// 2. Try to create a fake token with wrong secret
console.log('2️⃣ Creating FAKE token with wrong secret...');
const fakeToken = jwt.sign({
  iss: 'malicious-actor',
  aud: 'client-portal',
  scope: ['user:read', 'user:create', 'admin:all'], // malicious scopes
  exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
}, FAKE_SECRET);

console.log('❌ Fake token created:', fakeToken.substring(0, 50) + '...\n');

// 3. Try to verify both tokens with the real secret
console.log('3️⃣ Verifying tokens with real secret...');

try {
  const validPayload = jwt.verify(validToken, REAL_SECRET);
  console.log('✅ Valid token VERIFIED:', {
    issuer: validPayload.iss,
    audience: validPayload.aud,
    scopes: validPayload.scope
  });
} catch (error) {
  console.log('❌ Valid token FAILED:', error.message);
}

try {
  const fakePayload = jwt.verify(fakeToken, REAL_SECRET);
  console.log('😱 Fake token VERIFIED (THIS SHOULD NOT HAPPEN):', fakePayload);
} catch (error) {
  console.log('✅ Fake token REJECTED:', error.message);
}

// 4. Show what happens with tampered token
console.log('\n4️⃣ Testing tampered token...');
const tamperedToken = validToken.slice(0, -10) + 'TAMPERED12';
try {
  const tamperedPayload = jwt.verify(tamperedToken, REAL_SECRET);
  console.log('😱 Tampered token VERIFIED (THIS SHOULD NOT HAPPEN):', tamperedPayload);
} catch (error) {
  console.log('✅ Tampered token REJECTED:', error.message);
}

// 5. Show expired token
console.log('\n5️⃣ Testing expired token...');
const expiredToken = jwt.sign({
  iss: 'test-service',
  aud: 'client-portal',
  scope: ['user:read'],
  exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
}, REAL_SECRET);

try {
  const expiredPayload = jwt.verify(expiredToken, REAL_SECRET);
  console.log('😱 Expired token VERIFIED (THIS SHOULD NOT HAPPEN):', expiredPayload);
} catch (error) {
  console.log('✅ Expired token REJECTED:', error.message);
}

console.log('\n🎯 Summary:');
console.log('• Valid tokens with correct secret: ✅ PASS');
console.log('• Fake tokens with wrong secret: ❌ FAIL');
console.log('• Tampered tokens: ❌ FAIL');
console.log('• Expired tokens: ❌ FAIL');
console.log('\n🔒 This is why JWT verification is secure!');
