/**
 * Admin CLI for managing service clients dynamically
 * This demonstrates the power of database-level access control
 */

import dotenv from 'dotenv';
import { ServiceClientManager, ServiceClientExamples } from '../lib/service-client-manager';

dotenv.config();

const manager = new ServiceClientManager();
const examples = new ServiceClientExamples();

async function showMenu() {
  console.log('\n🔐 Service Client Management CLI\n');
  console.log('1. List all clients');
  console.log('2. Disable a client (instant revocation)');
  console.log('3. Enable a client');
  console.log('4. Rotate client secret');
  console.log('5. Update client scopes');
  console.log('6. Handle security incident (demo)');
  console.log('7. Onboard new integration (demo)');
  console.log('8. Exit');
  console.log('');
}

async function listClients() {
  console.log('\n📋 Current Service Clients:\n');
  const clients = await manager.listClients();
  
  clients.forEach(client => {
    const status = client.isActive ? '✅ Active' : '❌ Disabled';
    const lastUsed = client.lastUsed ? client.lastUsed.toLocaleDateString() : 'Never';
    
    console.log(`🏢 ${client.name} (${client.id})`);
    console.log(`   Status: ${status}`);
    console.log(`   Scopes: ${client.allowedScopes.join(', ')}`);
    console.log(`   Rate Limit: ${client.rateLimit || 'Unlimited'} req/min`);
    console.log(`   Last Used: ${lastUsed}`);
    console.log(`   Description: ${client.description || 'No description'}`);
    console.log('');
  });
}

async function disableClient() {
  console.log('\n🔒 Disable Client\n');
  const clients = await manager.listClients();
  const activeClients = clients.filter(c => c.isActive);
  
  if (activeClients.length === 0) {
    console.log('No active clients to disable.');
    return;
  }
  
  console.log('Active clients:');
  activeClients.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name} (${client.id})`);
  });
  
  // Simulate user selection (in real CLI, you'd use readline)
  const selectedIndex = 0; // For demo, select first client
  const selectedClient = activeClients[selectedIndex];
  
  console.log(`\n🔒 Disabling ${selectedClient.name}...`);
  await manager.disableClient(selectedClient.id);
  console.log('✅ Client disabled immediately! No app restart required.');
  console.log('💡 All future API calls from this client will be rejected.');
}

async function enableClient() {
  console.log('\n🔓 Enable Client\n');
  const clients = await manager.listClients();
  const disabledClients = clients.filter(c => !c.isActive);
  
  if (disabledClients.length === 0) {
    console.log('No disabled clients to enable.');
    return;
  }
  
  console.log('Disabled clients:');
  disabledClients.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name} (${client.id})`);
  });
  
  const selectedIndex = 0;
  const selectedClient = disabledClients[selectedIndex];
  
  console.log(`\n🔓 Enabling ${selectedClient.name}...`);
  await manager.enableClient(selectedClient.id);
  console.log('✅ Client enabled immediately! Ready to accept API calls.');
}

async function rotateSecret() {
  console.log('\n🔄 Rotate Client Secret\n');
  const clients = await manager.listClients();
  
  console.log('Available clients:');
  clients.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name} (${client.id})`);
  });
  
  const selectedIndex = 0;
  const selectedClient = clients[selectedIndex];
  
  console.log(`\n🔄 Rotating secret for ${selectedClient.name}...`);
  const newSecret = await manager.rotateSecret(selectedClient.id);
  console.log('✅ Secret rotated successfully!');
  console.log(`🔑 New secret: ${newSecret.substring(0, 8)}... (truncated for security)`);
  console.log('💡 Update your client application with the new secret.');
}

async function updateScopes() {
  console.log('\n📝 Update Client Scopes\n');
  const clients = await manager.listClients();
  
  console.log('Available clients:');
  clients.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name} (${client.id}) - Current: [${client.allowedScopes.join(', ')}]`);
  });
  
  const selectedIndex = 0;
  const selectedClient = clients[selectedIndex];
  
  // Demo: Remove write permissions, keep only read
  const newScopes = ['user:read'];
  
  console.log(`\n📝 Updating scopes for ${selectedClient.name}...`);
  console.log(`Old scopes: [${selectedClient.allowedScopes.join(', ')}]`);
  console.log(`New scopes: [${newScopes.join(', ')}]`);
  
  await manager.updateScopes(selectedClient.id, newScopes);
  console.log('✅ Scopes updated immediately!');
  console.log('💡 Client can now only perform read operations.');
}

async function simulateSecurityIncident() {
  console.log('\n🚨 SECURITY INCIDENT SIMULATION\n');
  console.log('Scenario: Suspicious activity detected from legacy-integration client');
  console.log('Action: Immediate containment without service disruption\n');
  
  await examples.handleSecurityIncident();
  
  console.log('\n🛡️ Incident Response Summary:');
  console.log('✅ Compromised client immediately disabled');
  console.log('✅ All other client secrets rotated');
  console.log('✅ Service continues to operate normally');
  console.log('✅ No application restart required');
  console.log('✅ No environment variable changes needed');
}

async function simulateOnboarding() {
  console.log('\n🆕 NEW INTEGRATION ONBOARDING\n');
  console.log('Scenario: Partner wants to integrate with our API');
  console.log('Action: Create new client with limited permissions\n');
  
  await examples.onboardNewIntegration();
  
  console.log('\n🎉 Onboarding Complete:');
  console.log('✅ New client created with unique credentials');
  console.log('✅ Limited scope permissions assigned');
  console.log('✅ Rate limiting configured');
  console.log('✅ IP whitelist applied');
  console.log('✅ Ready to use immediately');
}

async function main() {
  console.log('🚀 Service Client Management Demo');
  console.log('This demonstrates dynamic, database-level access control');
  console.log('===================================================');
  
  while (true) {
    await showMenu();
    
    // For demo purposes, we'll run through each option
    // In a real CLI, you'd use readline to get user input
    
    console.log('Demo: Running through all management scenarios...\n');
    
    await listClients();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await disableClient();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await enableClient();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await rotateSecret();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await updateScopes();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await simulateSecurityIncident();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await simulateOnboarding();
    
    console.log('\n🎯 Key Advantages Demonstrated:');
    console.log('  ✓ Instant access control without restarts');
    console.log('  ✓ Per-client secret management');
    console.log('  ✓ Granular permission control');
    console.log('  ✓ Real-time security response');
    console.log('  ✓ Zero-downtime client management');
    console.log('  ✓ Database-driven configuration');
    
    break; // End demo
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
