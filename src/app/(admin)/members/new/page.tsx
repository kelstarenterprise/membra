"use client";

import { useRouter } from "next/navigation";

import type { Member } from "@/types/member";
import MemberForm, { MemberFormValues } from "@/components/admin/MemberForm";

export default function NewMemberPage() {
  const router = useRouter();

  async function apiCreate(values: MemberFormValues): Promise<Member> {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(j.error || "Create failed");
    }
    const json = (await res.json()) as { data: Member };
    return json.data;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New Member</h1>
        <p className="text-sm text-muted-foreground">
          Create a new member record.
        </p>
      </div>

      <MemberForm
        submitting={false}
        onSubmit={async (values) => {
          await apiCreate(values);
          router.push("/admin/members"); // back to list
        }}
      />
    </div>
  );
}
