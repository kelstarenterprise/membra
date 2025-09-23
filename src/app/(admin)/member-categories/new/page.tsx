"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberCategoryForm, {
  type MemberCategoryFormValues,
} from "@/components/admin/MemberCategoryForm";
import type { MemberCategoryErrorResponse } from "@/types/member-category";

export default function NewMemberCategoryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (values: MemberCategoryFormValues) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/member-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: values.code.trim(), // already uppercased by schema
          name: values.name.trim(),
          description: values.description ?? null,
          rank: typeof values.rank === "number" ? values.rank : null,
          active: values.active,
        }),
      });

      const json = await res.json() as MemberCategoryErrorResponse;

      if (!res.ok) {
        setServerError(json.error || "Failed to create member category");
        return;
      }

      router.push("/member-categories"); // adjust if your route differs
      router.refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Network error";
      setServerError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-1">Create Member Category</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Define a category/level (e.g., <strong>GOLD</strong>,{" "}
        <strong>SILVER</strong>) that can be assigned to members and used for
        dues plans.
      </p>

      <MemberCategoryForm
        onSubmit={handleSubmit}
        submitting={submitting}
        serverError={serverError}
      />
    </div>
  );
}
