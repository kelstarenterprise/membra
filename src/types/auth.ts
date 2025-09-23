// TypeScript types for Authentication

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: "ADMIN" | "MEMBER";
  memberId?: string | null;
  membershipId?: string | null;
}

export interface ExtendedSession {
  user: SessionUser;
  expires: string;
}