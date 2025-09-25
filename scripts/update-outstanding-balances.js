const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

async function updateOutstandingBalances() {
  try {
    console.log('💰 Recalculating outstanding balances for all members...');
    
    // Get all members
    const members = await prisma.member.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        outstandingBalance: true
      }
    });
    
    // Get all assigned dues (pending and partial)
    const assignedDues = await prisma.assignedDues.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      select: {
        memberId: true,
        amount: true,
        status: true
      }
    });
    
    // Get all payments
    const payments = await prisma.payment.findMany({
      select: {
        memberId: true,
        amount: true
      }
    });
    
    console.log(`Found ${members.length} members, ${assignedDues.length} unpaid dues, ${payments.length} payments`);
    
    const updates = [];
    
    for (const member of members) {
      // Calculate total unpaid dues for this member
      const memberDues = assignedDues.filter(d => d.memberId === member.id);
      const totalDues = memberDues.reduce((sum, due) => sum + Number(due.amount), 0);
      
      // Calculate total payments by this member
      const memberPayments = payments.filter(p => p.memberId === member.id);
      const totalPayments = memberPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Outstanding balance = Total unpaid dues - Total payments (but not negative)
      const outstandingBalance = Math.max(0, totalDues - totalPayments);
      const currentBalance = Number(member.outstandingBalance);
      
      if (Math.abs(outstandingBalance - currentBalance) > 0.01) {
        updates.push({
          member,
          oldBalance: currentBalance,
          newBalance: outstandingBalance,
          totalDues,
          totalPayments
        });
      }
    }
    
    console.log(`\n🔄 ${updates.length} members need balance updates:`);
    
    for (const update of updates) {
      console.log(`${update.member.firstName} ${update.member.lastName}:`);
      console.log(`  Old: ${update.oldBalance} GHS`);
      console.log(`  New: ${update.newBalance} GHS`);
      console.log(`  (${update.totalDues} dues - ${update.totalPayments} payments)`);
      
      // Update the member's outstanding balance
      await prisma.member.update({
        where: { id: update.member.id },
        data: {
          outstandingBalance: new Decimal(update.newBalance)
        }
      });
    }
    
    if (updates.length > 0) {
      console.log('\n✅ Outstanding balances updated successfully!');
    } else {
      console.log('\n✅ All outstanding balances are already correct!');
    }
    
    // Show final summary
    const updatedMembers = await prisma.member.findMany({
      select: {
        firstName: true,
        lastName: true,
        outstandingBalance: true,
        status: true
      },
      orderBy: { firstName: 'asc' }
    });
    
    console.log('\n📊 Final outstanding balances:');
    console.table(updatedMembers.map(m => ({
      name: `${m.firstName} ${m.lastName}`,
      status: m.status,
      outstanding: `${Number(m.outstandingBalance).toFixed(2)} GHS`
    })));
    
  } catch (error) {
    console.error('❌ Error updating outstanding balances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOutstandingBalances();