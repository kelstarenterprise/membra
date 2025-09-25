import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Recalculates and updates the outstanding balance for a specific member
 * Outstanding balance = Total unpaid dues - Total payments (minimum 0)
 */
export async function updateMemberOutstandingBalance(memberId: string): Promise<number> {
  try {
    // Get all unpaid assigned dues for this member
    const assignedDues = await prisma.assignedDues.findMany({
      where: {
        memberId,
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      select: {
        amount: true
      }
    });

    // Get all payments made by this member
    const payments = await prisma.payment.findMany({
      where: {
        memberId
      },
      select: {
        amount: true
      }
    });

    // Calculate totals
    const totalDues = assignedDues.reduce((sum, due) => sum + Number(due.amount), 0);
    const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Outstanding balance = dues - payments (but not negative)
    const outstandingBalance = Math.max(0, totalDues - totalPayments);

    // Update the member's outstanding balance
    await prisma.member.update({
      where: { id: memberId },
      data: {
        outstandingBalance: new Decimal(outstandingBalance)
      }
    });

    console.log(`Updated outstanding balance for member ${memberId}: ${outstandingBalance} GHS`);
    return outstandingBalance;

  } catch (error) {
    console.error(`Error updating outstanding balance for member ${memberId}:`, error);
    throw error;
  }
}

/**
 * Recalculates and updates outstanding balances for all members
 * Useful for batch operations or data consistency checks
 */
export async function updateAllOutstandingBalances(): Promise<void> {
  try {
    const members = await prisma.member.findMany({
      select: { id: true }
    });

    console.log(`Updating outstanding balances for ${members.length} members...`);

    for (const member of members) {
      await updateMemberOutstandingBalance(member.id);
    }

    console.log('✅ All outstanding balances updated successfully');

  } catch (error) {
    console.error('Error updating all outstanding balances:', error);
    throw error;
  }
}