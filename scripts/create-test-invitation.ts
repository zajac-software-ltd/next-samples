import { prisma } from '../lib/prisma';
import { randomBytes } from 'crypto';

async function createTestInvitation() {
  try {
    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: { email: 'temp@example.com' }
    });

    // Create new unclaimed user
    const claimToken = 'test_' + randomBytes(6).toString('hex');
    const claimTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const user = await prisma.user.create({
      data: {
        email: 'temp@example.com',
        name: 'Temp User',
        role: 'USER',
        isClaimed: false,
        claimToken,
        claimTokenExpires,
      }
    });

    console.log('🔗 Test invitation created!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🎫 Claim token: ${claimToken}`);
    console.log(`⏰ Expires: ${claimTokenExpires.toISOString()}`);
    console.log('');
    console.log('🌐 Test URLs:');
    console.log(`   Claim account: http://localhost:3001/auth/claim?token=${claimToken}`);
    console.log(`   Continue without claiming: http://localhost:3001/auth/continue?token=${claimToken}`);
    console.log('');
    console.log('📋 Test flow:');
    console.log('1. Click "Continue without claiming" link');
    console.log('2. Try to access /dashboard');
    console.log('3. Should see temporary session indicator');
    console.log('4. Try claim account link in dashboard');

  } catch (error) {
    console.error('❌ Error creating test invitation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestInvitation();
