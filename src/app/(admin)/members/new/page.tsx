"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Member } from "@/types/member";
import MemberForm, { MemberFormValues } from "@/components/admin/MemberForm";
import { useToast } from "@/components/providers/toast-provider";

export default function NewMemberPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  async function apiCreate(values: MemberFormValues): Promise<Member> {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: "Unknown error" }));
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
        submitting={submitting}
        onSubmit={async (values) => {
          try {
            setSubmitting(true);
            const member = await apiCreate(values);
            success(
              "Member Created Successfully", 
              `${member.firstName} ${member.lastName} has been added to the system.`
            );
            
            // Small delay to show success message before redirecting
            setTimeout(() => {
              router.push("/members");
            }, 1500);
          } catch (error) {
            console.error("Error creating member:", error);
            showError(
              "Failed to Create Member",
              error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
            );
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}
