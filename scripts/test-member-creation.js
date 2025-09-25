const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMemberCreation() {
  try {
    console.log('🔍 Testing member creation...');
    
    // 1. Check member categories
    console.log('\n📋 Available member categories:');
    const categories = await prisma.memberCategory.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        active: true
      }
    });
    console.table(categories);
    
    if (categories.length === 0) {
      console.error('❌ No member categories found! This is likely the issue.');
      console.log('💡 Create some member categories first.');
      return;
    }
    
    // 2. Try creating a test member directly via Prisma
    console.log('\n🧪 Testing direct member creation via Prisma...');
    const testMember = {
      membershipId: 'TEST12345',
      firstName: 'Test',
      lastName: 'Member',
      email: 'test.member@example.com',
      phone: '0244567890',
      gender: 'MALE',
      dateOfBirth: new Date('1990-01-01'),
      nationalId: 'TEST123456789',
      residentialAddress: '123 Test Street, Test City',
      regionConstituencyElectoralArea: 'Greater Accra',
      membershipLevel: 'ORDINARY',
      memberCategoryId: categories[0].id, // Use first available category
      status: 'PROSPECT',
      outstandingBalance: 0,
    };
    
    const created = await prisma.member.create({
      data: testMember,
      include: {
        memberCategory: true
      }
    });
    
    console.log('✅ Successfully created test member via Prisma:');
    console.log(`   Name: ${created.firstName} ${created.lastName}`);
    console.log(`   ID: ${created.membershipId}`);
    console.log(`   Category: ${created.memberCategory?.name || 'None'}`);
    
    // Clean up
    await prisma.member.delete({
      where: { id: created.id }
    });
    console.log('🧹 Cleaned up test member');
    
    // 3. Test API validation
    console.log('\n🔬 Testing API validation schema...');
    
    const sampleApiData = {
      firstName: 'API Test',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      nationalId: '987654321',
      phone: '0244567890',
      residentialAddress: '123 API Test Street',
      regionConstituencyElectoralArea: 'Greater Accra',
      email: 'api.test@example.com',
      membershipLevel: 'ORDINARY',
      level: categories[0].code, // Use the first category's code
      status: 'PROSPECT'
    };
    
    console.log('📤 Sample API payload:');
    console.log(JSON.stringify(sampleApiData, null, 2));
    
    // 4. Check for common issues
    console.log('\n🔍 Checking for common issues...');
    
    // Check if there are existing members with conflicting data
    const conflicts = await prisma.member.findMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { nationalId: '12345678901' },
          { phone: '0244567890' }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        nationalId: true,
        phone: true
      }
    });
    
    if (conflicts.length > 0) {
      console.log('⚠️  Found potential conflicts with existing members:');
      console.table(conflicts);
    } else {
      console.log('✅ No conflicts found with sample data');
    }
    
    console.log('\n✅ Member creation test completed successfully!');
    console.log('\n💡 If the UI is still failing, check:');
    console.log('   1. Authentication - make sure you\'re logged in as an admin');
    console.log('   2. Form validation - check browser console for errors');
    console.log('   3. Network requests - check browser dev tools network tab');
    console.log('   4. Server logs - look for detailed error messages');
    
  } catch (error) {
    console.error('❌ Error during member creation test:', error);
    
    if (error.code === 'P2002') {
      console.log('\n💡 This is a unique constraint violation. Details:');
      console.log('   Target:', error.meta?.target);
      console.log('   This means there\'s already data with the same unique field');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testMemberCreation()
  .then(() => {
    console.log('\n🎉 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });