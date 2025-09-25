const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSuspendedMember() {
  try {
    const categories = await prisma.memberCategory.findMany();
    const bronzeCategory = categories.find(c => c.code === 'BRONZE');
    
    if (!bronzeCategory) {
      console.log('No Bronze category found');
      return;
    }
    
    // Create a suspended member for testing
    const suspendedMember = await prisma.member.create({
      data: {
        membershipId: 'SUSP001',
        firstName: 'Suspended',
        lastName: 'Member',
        email: 'suspended@example.com',
        phone: '0200000000',
        gender: 'MALE',
        dateOfBirth: new Date('1985-01-01'),
        nationalId: 'SUSP123456789',
        residentialAddress: '123 Suspended Street',
        regionConstituencyElectoralArea: 'Test Region',
        membershipLevel: 'ORDINARY',
        memberCategoryId: bronzeCategory.id,
        status: 'SUSPENDED', // This member should not be selectable
        outstandingBalance: 0,
      },
      include: {
        memberCategory: true
      }
    });
    
    console.log('✅ Created suspended member for testing:', suspendedMember.firstName, suspendedMember.lastName);
    
    // Show all members with their statuses
    const allMembers = await prisma.member.findMany({
      select: {
        firstName: true,
        lastName: true,
        status: true,
        memberCategory: { select: { name: true } }
      },
      orderBy: { status: 'asc' }
    });
    
    console.log('\n📊 All members by status:');
    console.table(allMembers.map(m => ({
      name: `${m.firstName} ${m.lastName}`,
      status: m.status,
      category: m.memberCategory?.name || 'None'
    })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuspendedMember();