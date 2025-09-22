// src/lib/session.ts
import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth(); // ⬅️ v5 way
  return session?.user as {
    id: string;
    role: "ADMIN" | "MEMBER";
    memberId?: string | null;
  } | null;
}
