export const BILLING_CYCLE = [
  "ONE_TIME",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
] as const;
export type BillingCycle = (typeof BILLING_CYCLE)[number];

export type SubscriptionPlan = {
  id: string;
  name: string;
  code: string; // unique short code (e.g., DUES2025)
  amount: number; // in base currency units
  currency: string; // "GHS"
  billingCycle: BillingCycle;
  active: boolean;
  createdAt: string; // ISO
};

export const TARGET_TYPE = ["LEVEL", "INDIVIDUAL"] as const;
export type TargetType = (typeof TARGET_TYPE)[number];

export type DuesAssessment = {
  id: string;
  planId: string;
  planName: string;
  period: string; // e.g., "2025-09" or "2025"
  targetType: TargetType;
  targetLevel?: string | null; // when targetType = LEVEL
  memberIds?: string[]; // when targetType = INDIVIDUAL
  createdAt: string;
  createdBy: string;
};

export type MemberSubscription = {
  id: string;
  memberId: string;
  memberName: string;
  level?: string | null;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  period: string;
  status: "PENDING" | "PAID" | "WAIVED";
  assessmentId: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  memberId: string;
  memberName: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string; // reuse plan currency
  paidAt: string; // ISO date string "YYYY-MM-DD" or full ISO
  reference?: string; // optional receipt/reference
  createdAt: string; // ISO
};
