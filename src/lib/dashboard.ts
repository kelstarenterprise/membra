import { prisma } from "@/lib/prisma";
import { MemberStatus } from "@prisma/client";

export interface DashboardStats {
  kpiCards: Array<{
    label: string;
    value: number | string;
  }>;
  recentMembers: Array<{
    id: string;
    name: string;
    status: string;
    membershipLevel: string;
    joinedAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    method: string;
    paidAt: string;
    description?: string;
    memberName: string;
  }>;
}

/**
 * Get the start and end dates for the current month
 */
export function getCurrentMonthDateRange() {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { currentMonthStart, currentMonthEnd, currentMonth: now.toLocaleString('default', { month: 'short' }) };
}

/**
 * Get member count by status
 */
export async function getMemberCountByStatus(status: MemberStatus): Promise<number> {
  return await prisma.member.count({
    where: { status }
  });
}

/**
 * Get total dues posted for a specific date range
 */
export async function getDuesPostedInPeriod(startDate: Date, endDate: Date): Promise<number> {
  const result = await prisma.assignedDues.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["PENDING", "PARTIAL", "PAID"]
      }
    },
    _sum: {
      amount: true
    }
  });

  return Number(result._sum.amount) || 0;
}

/**
 * Get total payments received for a specific date range
 */
export async function getPaymentsInPeriod(startDate: Date, endDate: Date): Promise<number> {
  const result = await prisma.payment.aggregate({
    where: {
      paidAt: {
        gte: startDate,
        lte: endDate,
      }
    },
    _sum: {
      amount: true
    }
  });

  return Number(result._sum.amount) || 0;
}

/**
 * Get recent members
 */
export async function getRecentMembers(limit: number = 5) {
  const members = await prisma.member.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      createdAt: true,
      membershipLevel: true
    }
  });

  return members.map(member => ({
    id: member.id,
    name: `${member.firstName} ${member.lastName}`,
    status: member.status,
    membershipLevel: member.membershipLevel,
    joinedAt: member.createdAt.toISOString()
  }));
}

/**
 * Get recent payments
 */
export async function getRecentPayments(limit: number = 5) {
  const payments = await prisma.payment.findMany({
    orderBy: {
      paidAt: "desc"
    },
    take: limit,
    select: {
      id: true,
      amount: true,
      currency: true,
      method: true,
      paidAt: true,
      description: true,
      member: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });

  return payments.map(payment => ({
    id: payment.id,
    amount: Number(payment.amount),
    currency: payment.currency,
    method: payment.method,
    paidAt: payment.paidAt.toISOString(),
    description: payment.description || undefined,
    memberName: `${payment.member.firstName} ${payment.member.lastName}`
  }));
}

/**
 * Get complete dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { currentMonthStart, currentMonthEnd, currentMonth } = getCurrentMonthDateRange();

  // Execute all queries concurrently for better performance
  const [
    activeMembersCount,
    pendingApprovalsCount,
    duesPosted,
    paymentsReceived,
    recentMembers,
    recentPayments
  ] = await Promise.all([
    getMemberCountByStatus("ACTIVE"),
    getMemberCountByStatus("PENDING"),
    getDuesPostedInPeriod(currentMonthStart, currentMonthEnd),
    getPaymentsInPeriod(currentMonthStart, currentMonthEnd),
    getRecentMembers(5),
    getRecentPayments(5)
  ]);

  return {
    kpiCards: [
      {
        label: "Active Members",
        value: activeMembersCount
      },
      {
        label: "Pending Approvals",
        value: pendingApprovalsCount
      },
      {
        label: `Dues Posted (${currentMonth})`,
        value: `GHS ${duesPosted.toFixed(2)}`
      },
      {
        label: `Payments (${currentMonth})`,
        value: `GHS ${paymentsReceived.toFixed(2)}`
      }
    ],
    recentMembers,
    recentPayments
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'GHS'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Format member status for display
 */
export function formatMemberStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'ACTIVE': 'Active',
    'PENDING': 'Pending',
    'PROSPECT': 'Prospect',
    'SUSPENDED': 'Suspended'
  };
  
  return statusMap[status] || status;
}

/**
 * Format membership level for display
 */
export function formatMembershipLevel(level: string): string {
  const levelMap: { [key: string]: string } = {
    'ORDINARY': 'Ordinary',
    'EXECUTIVE': 'Executive',
    'DELEGATE': 'Delegate',
    'OTHER': 'Other'
  };
  
  return levelMap[level] || level;
}