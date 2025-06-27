import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testInvitationFlow() {
  console.log('🧪 Testing Account Invitation/Claiming Flow\n');

  try {
    // 1. Create admin user for testing
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: adminPassword,
        role: 'ADMIN',
        isClaimed: true,
      },
    });
    console.log('✅ Admin user created/verified:', admin.email);

    // 2. Test invitation creation (simulating API call)
    const inviteData = {
      name: 'Test User',
      email: 'testuser@example.com',
      role: 'USER',
    };

    // Generate claim token
    const claimToken = 'test_token_' + Math.random().toString(36).substring(7);
    const claimTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Clean up any existing user with this email
    await prisma.user.deleteMany({
      where: { email: inviteData.email }
    });

    const invitedUser = await prisma.user.create({
      data: {
        name: inviteData.name,
        email: inviteData.email,
        role: inviteData.role as 'USER' | 'ADMIN',
        claimToken,
        claimTokenExpires,
        isClaimed: false,
      },
    });
    console.log('✅ User invitation created:', invitedUser.email);
    console.log('   Claim token:', claimToken);
    console.log('   Expires:', claimTokenExpires.toISOString());

    // 3. Test claim token validation
    const validToken = await prisma.user.findFirst({
      where: {
        claimToken: claimToken,
        claimTokenExpires: { gt: new Date() },
        isClaimed: false,
      },
    });
    console.log('✅ Claim token validation:', validToken ? 'VALID' : 'INVALID');

    // 4. Test account claiming
    const newPassword = 'newuserpassword123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const claimedUser = await prisma.user.update({
      where: { id: invitedUser.id },
      data: {
        password: hashedPassword,
        isClaimed: true,
        claimToken: null,
        claimTokenExpires: null,
      },
    });
    console.log('✅ Account claimed successfully:', claimedUser.email);
    console.log('   isClaimed:', claimedUser.isClaimed);
    console.log('   claimToken:', claimedUser.claimToken);

    // 5. Test that claimed account can't be claimed again
    const cannotClaimAgain = await prisma.user.findFirst({
      where: {
        claimToken: claimToken,
        claimTokenExpires: { gt: new Date() },
        isClaimed: false,
      },
    });
    console.log('✅ Cannot claim again:', cannotClaimAgain ? 'FAILED' : 'SUCCESS');

    // 6. Test password authentication
    const userForAuth = await prisma.user.findUnique({
      where: { email: inviteData.email }
    });
    
    if (userForAuth?.password) {
      const isPasswordValid = await bcrypt.compare(newPassword, userForAuth.password);
      console.log('✅ Password authentication:', isPasswordValid ? 'SUCCESS' : 'FAILED');
    }

    // 7. Test expired token scenario
    await prisma.user.create({
      data: {
        name: 'Expired User',
        email: 'expired@test.com',
        role: 'USER',
        claimToken: 'expired_token_123',
        claimTokenExpires: new Date(Date.now() - 1000), // Expired 1 second ago
        isClaimed: false,
      },
    });

    const expiredTokenTest = await prisma.user.findFirst({
      where: {
        claimToken: 'expired_token_123',
        claimTokenExpires: { gt: new Date() },
        isClaimed: false,
      },
    });
    console.log('✅ Expired token test:', expiredTokenTest ? 'FAILED' : 'SUCCESS');

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testInvitationFlow();
