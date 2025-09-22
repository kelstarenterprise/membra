import { auth } from "@/auth";

export type AppRole = "ADMIN" | "MEMBER" | "GUEST";

type UserWithRole = {
  role?: AppRole;
};

export async function getServerRole(): Promise<AppRole> {
  const session = await auth();
  const user = session?.user as UserWithRole | undefined;
  const role = user?.role;
  return role === "ADMIN" || role === "MEMBER" || role === "GUEST"
    ? role
    : "GUEST";
}
