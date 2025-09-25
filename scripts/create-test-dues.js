const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestDues() {
  try {
    console.log('🧪 Creating test assigned dues with different statuses...');
    
    // Get active members and a plan
    const members = await prisma.member.findMany({
      where: {
        status: { in: ['PROSPECT', 'ACTIVE'] }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        memberCategoryId: true,
        status: true
      }
    });
    
    const plans = await prisma.duesPlan.findMany({
      select: { id: true, name: true, code: true, amount: true, currency: true }
    });
    
    if (members.length === 0) {
      console.log('❌ No active members found');
      return;
    }
    
    if (plans.length === 0) {
      console.log('❌ No plans found');
      return;
    }
    
    console.log(`Found ${members.length} members and ${plans.length} plans`);
    
    // Create different types of dues
    const testDues = [];
    const plan = plans[0]; // Use first available plan
    
    for (let i = 0; i < Math.min(3, members.length); i++) {
      const member = members[i];
      
      // Create one due for each status
      const statuses = ['PENDING', 'PARTIAL', 'PAID'];
      const status = statuses[i % 3];
      
      const due = await prisma.assignedDues.create({
        data: {
          memberId: member.id,
          planId: plan.id,
          memberCategoryId: member.memberCategoryId,
          amount: plan.amount,
          currency: plan.currency,
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31'),
          dueDate: new Date('2025-01-31'),
          status: status,
          reference: `TEST-${status}-${member.firstName}`,
          notes: `Test ${status} due for ${member.firstName} ${member.lastName}`,
        },
        include: {
          member: {
            select: { firstName: true, lastName: true }
          },
          plan: {
            select: { name: true }
          }
        }
      });
      
      testDues.push(due);
      console.log(`✅ Created ${status} due for ${due.member.firstName} ${due.member.lastName} - ${due.plan.name}`);
    }
    
    // Show summary
    console.log('\n📊 Test dues created:');
    console.table(testDues.map(d => ({
      member: `${d.member.firstName} ${d.member.lastName}`,
      plan: d.plan.name,
      status: d.status,
      amount: `${Number(d.amount)} ${d.currency}`,
      reference: d.reference
    })));
    
    console.log('\n🎯 Testing expectations:');
    console.log('  • PENDING dues should appear in dues payment page');
    console.log('  • PARTIAL dues should appear in dues payment page'); 
    console.log('  • PAID dues should NOT appear in dues payment page');
    
    // Show what should be visible in dues payment
    const visibleDues = testDues.filter(d => ['PENDING', 'PARTIAL'].includes(d.status));
    console.log(`\n✅ ${visibleDues.length} dues should be visible in payment page`);
    
  } catch (error) {
    console.error('❌ Error creating test dues:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDues();