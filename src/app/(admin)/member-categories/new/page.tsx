"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberCategoryForm, {
  type MemberCategoryFormValues,
} from "@/components/admin/MemberCategoryForm";
import type { MemberCategoryErrorResponse } from "@/types/member-category";
import { FormWithBanner, useFormBannerActions } from "@/components/forms/FormBanner";

function MemberCategoryFormWithActions() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { success, error: showError } = useFormBannerActions();

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
        const errorMsg = json.error || "Failed to create member category";
        setServerError(errorMsg);
        showError("Category Creation Failed", errorMsg);
        return;
      }

      success(
        "Category Created Successfully",
        `Member category "${values.name}" has been created.`
      );

      // Small delay to show success message before redirecting
      setTimeout(() => {
        router.push("/member-categories");
        router.refresh();
      }, 1500);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Network error";
      setServerError(errorMessage);
      showError("Category Creation Failed", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MemberCategoryForm
      onSubmit={handleSubmit}
      submitting={submitting}
      serverError={serverError}
    />
  );
}

export default function NewMemberCategoryPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-1">Create Member Category</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Define a category/level (e.g., <strong>GOLD</strong>,{" "}
        <strong>SILVER</strong>) that can be assigned to members and used for
        dues plans.
      </p>

      <FormWithBanner>
        <MemberCategoryFormWithActions />
      </FormWithBanner>
    </div>
  );
}
