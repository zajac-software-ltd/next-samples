#!/usr/bin/env node

/**
 * Script to generate service tokens for testing
 * Usage: node scripts/generate-service-token.js [issuer] [scopes]
 */

import { generateServiceToken, SERVICE_SCOPES } from '../lib/service-auth.js';

// Parse command line arguments
const args = process.argv.slice(2);
const issuer = args[0] || 'main-app';
const scopesArg = args[1] || 'user:read,user:create,invite:send';
const scopes = scopesArg.split(',').map(s => s.trim());

console.log('Generating service token...');
console.log('Issuer:', issuer);
console.log('Scopes:', scopes);
console.log('');

try {
  const token = generateServiceToken(issuer, scopes, '24h');
  
  console.log('✅ Service token generated successfully!');
  console.log('');
  console.log('Token:');
  console.log(token);
  console.log('');
  console.log('Example usage:');
  console.log('curl -H "Authorization: Bearer ' + token + '" \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     http://localhost:3000/api/service/users');
  console.log('');
  console.log('Available scopes:', Object.values(SERVICE_SCOPES).join(', '));
  
} catch (error) {
  console.error('❌ Error generating token:', error.message);
  console.log('');
  console.log('Make sure you have SERVICE_JWT_SECRET set in your .env file');
  process.exit(1);
}
