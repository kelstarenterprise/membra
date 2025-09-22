"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { Member } from "@/types/member";
import MemberForm, { MemberFormValues } from "@/components/admin/MemberForm";

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [initial, setInitial] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const apiGetOne = useCallback(async (): Promise<Member> => {
    const res = await fetch(`/api/members/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Load failed");
    const json = (await res.json()) as { data: Member };
    return json.data;
  }, [id]);
  async function apiUpdate(values: Partial<MemberFormValues>): Promise<Member> {
    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("Update failed");
    const json = (await res.json()) as { data: Member };
    return json.data;
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const m = await apiGetOne();
        setInitial(m);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, apiGetOne]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!initial)
    return (
      <div className="p-6 text-sm text-muted-foreground">Member not found.</div>
    );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Edit Member</h1>
        <p className="text-sm text-muted-foreground">
          Update details for {initial.firstName} {initial.lastName}.
        </p>
      </div>

      <MemberForm
        initial={initial}
        submitting={false}
        onSubmit={async (values) => {
          await apiUpdate(values);
          router.push("/admin/members"); // back to list
        }}
      />
    </div>
  );
}
