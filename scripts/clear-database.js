const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    console.log('⚠️  WARNING: This will delete all data except users and member categories!');
    
    // Wait 3 seconds to allow cancellation
    console.log('⏳ Starting in 3 seconds... Press Ctrl+C to cancel');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🗑️  Deleting data in dependency order...');

    // 1. Delete activity registrations first (depends on activities and members)
    const activityRegistrations = await prisma.activityRegistration.deleteMany();
    console.log(`✓ Deleted ${activityRegistrations.count} activity registrations`);

    // 2. Delete activities
    const activities = await prisma.activity.deleteMany();
    console.log(`✓ Deleted ${activities.count} activities`);

    // 3. Delete notifications (depends on members)
    const notifications = await prisma.notification.deleteMany();
    console.log(`✓ Deleted ${notifications.count} notifications`);

    // 4. Delete member ID cards (depends on members)
    const memberIdCards = await prisma.memberIdCard.deleteMany();
    console.log(`✓ Deleted ${memberIdCards.count} member ID cards`);

    // 5. Delete payments first (depends on members, assigned dues, and dues plans)
    const payments = await prisma.payment.deleteMany();
    console.log(`✓ Deleted ${payments.count} payments`);

    // 6. Delete assigned dues (depends on members, dues plans, and member categories)
    const assignedDues = await prisma.assignedDues.deleteMany();
    console.log(`✓ Deleted ${assignedDues.count} assigned dues`);

    // 7. Delete dues plans (depends on member categories)
    const duesPlans = await prisma.duesPlan.deleteMany();
    console.log(`✓ Deleted ${duesPlans.count} dues plans`);

    // 8. Delete members (but keep user references intact)
    // First, disconnect users from members
    await prisma.user.updateMany({
      where: {
        memberId: {
          not: null
        }
      },
      data: {
        memberId: null
      }
    });
    console.log('✓ Disconnected users from members');

    const members = await prisma.member.deleteMany();
    console.log(`✓ Deleted ${members.count} members`);

    // 9. Delete auth-related data (sessions, accounts) but keep users
    const sessions = await prisma.session.deleteMany();
    console.log(`✓ Deleted ${sessions.count} sessions`);

    const accounts = await prisma.account.deleteMany();
    console.log(`✓ Deleted ${accounts.count} accounts`);

    const verificationTokens = await prisma.verificationToken.deleteMany();
    console.log(`✓ Deleted ${verificationTokens.count} verification tokens`);

    // Get counts of preserved data
    const usersCount = await prisma.user.count();
    const memberCategoriesCount = await prisma.memberCategory.count();

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\n📊 Preserved data:');
    console.log(`   • ${usersCount} users`);
    console.log(`   • ${memberCategoriesCount} member categories`);
    
    console.log('\n🗑️  All other data has been deleted:');
    console.log('   • Members and all related data');
    console.log('   • Activities and registrations');
    console.log('   • Dues plans and assigned dues');
    console.log('   • Payments');
    console.log('   • Notifications');
    console.log('   • Member ID cards');
    console.log('   • Auth sessions and accounts');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearDatabase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });