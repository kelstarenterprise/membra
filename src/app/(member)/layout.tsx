// src/app/(admin)/layout.tsx  (SERVER component)
import AppShell from "@/components/layout/AppShell";
import { auth } from "@/auth";
import { getServerRole } from "@/lib/getRole";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth(); // NextAuth v5 (server)
  const role = await getServerRole(); // "ADMIN" | "MEMBER" | "GUEST"
  const name = session?.user?.name ?? null;

  // Optional: hard guard this entire group
  if (role !== "MEMBER") {
    // import { redirect } from "next/navigation";
    // redirect("/dashboard");
  }

  return (
    <AppShell role={role} name={name}>
      {children}
    </AppShell>
  );
}
