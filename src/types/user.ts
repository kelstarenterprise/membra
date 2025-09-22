export const USER_ROLE = ["ADMIN", "MEMBER"] as const;
export type UserRole = (typeof USER_ROLE)[number];

export type User = {
  id: string;
  username: string; // unique; usually email or handle
  email: string;
  role: UserRole;
  memberId?: string | null; // optional link to a Member
  createdAt: string; // ISO
};
