// test-db-integration.js
// Simple script to test database connection and CRUD operations

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseIntegration() {
  console.log('🔄 Testing database integration...\n');

  try {
    // Test 1: Database Connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');

    // Test 2: Create a test member
    console.log('2. Testing member creation...');
    const testMember = await prisma.member.create({
      data: {
        membershipId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        nationalId: 'TEST123456789',
        phone: '+1234567890',
        residentialAddress: '123 Test Street',
        regionConstituencyElectoralArea: 'Test Region',
        membershipLevel: 'ORDINARY',
        email: 'john.doe.test@example.com',
        status: 'ACTIVE'
      }
    });
    console.log('✅ Test member created:', testMember.membershipId);

    // Test 3: Read the created member
    console.log('\\n3. Testing member retrieval...');
    const retrievedMember = await prisma.member.findUnique({
      where: { id: testMember.id }
    });
    console.log('✅ Member retrieved:', retrievedMember.firstName, retrievedMember.lastName);

    // Test 4: Update the member
    console.log('\\n4. Testing member update...');
    const updatedMember = await prisma.member.update({
      where: { id: testMember.id },
      data: { status: 'SUSPENDED', outstandingBalance: 100.50 }
    });
    console.log('✅ Member updated - Status:', updatedMember.status, 'Balance:', updatedMember.outstandingBalance);

    // Test 5: List all members
    console.log('\\n5. Testing member listing...');
    const allMembers = await prisma.member.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('✅ Found', allMembers.length, 'members in database');

    // Test 6: Delete the test member
    console.log('\\n6. Testing member deletion...');
    await prisma.member.delete({
      where: { id: testMember.id }
    });
    console.log('✅ Test member deleted successfully');

    // Test 7: Test search functionality
    console.log('\\n7. Testing search functionality...');
    const searchResults = await prisma.member.findMany({
      where: {
        OR: [
          { firstName: { contains: 'test', mode: 'insensitive' } },
          { lastName: { contains: 'test', mode: 'insensitive' } },
          { email: { contains: 'test', mode: 'insensitive' } }
        ]
      }
    });
    console.log('✅ Search functionality working - Found', searchResults.length, 'matching records');

    console.log('\\n🎉 All database integration tests passed successfully!');

  } catch (error) {
    console.error('❌ Database integration test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\\n🔌 Database connection closed.');
  }
}

// Run the test
testDatabaseIntegration();
