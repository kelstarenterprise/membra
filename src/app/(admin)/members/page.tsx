import MembersTable from "@/components/admin/MembersTable";
import { getServerRole } from "@/lib/getRole";
import { redirect } from "next/navigation";

export default async function MembersPage() {
  const role = await getServerRole();
  if (role !== "ADMIN") redirect("/dashboard");

  return <MembersTable />;
}
