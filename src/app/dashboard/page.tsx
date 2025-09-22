// src/app/dashboard/page.tsx (Server Component)
import AppShell from "@/components/layout/AppShell";
import AdminView from "@/components/dashboard/AdminView";
import MemberView from "@/components/dashboard/MemberView";
import GuestView from "@/components/dashboard/GuestView";
import { auth } from "@/auth";
import { getServerRole } from "@/lib/getRole";

export default async function DashboardPage() {
  const session = await auth(); // server session (v5)
  const role = await getServerRole();
  const name = session?.user?.name ?? null;

  return (
    <AppShell role={role} name={name}>
      {role === "ADMIN" ? (
        <AdminView />
      ) : role === "MEMBER" ? (
        <MemberView />
      ) : (
        <div className="min-h-[60vh] grid place-items-center">
          <GuestView />
        </div>
      )}
    </AppShell>
  );
}
