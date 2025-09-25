"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Member } from "@/types/member";
import MemberForm, { MemberFormValues } from "@/components/admin/MemberForm";
import { FormWithBanner, useFormBannerActions } from "@/components/forms/FormBanner";

function MemberFormWithActions() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useFormBannerActions();

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Failed to upload file');
    }
    
    const result = await res.json();
    return result.url;
  }

  async function apiCreate(values: MemberFormValues): Promise<Member> {
    // Handle file upload first if there's a passport picture
    let passportPictureUrl: string | null = null;
    
    if (values.passportPicture && values.passportPicture.length > 0) {
      try {
        passportPictureUrl = await uploadFile(values.passportPicture[0]);
      } catch (error) {
        throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Prepare member data (excluding the file object)
    const memberData = {
      ...values,
      passportPictureUrl,
      // Remove the file object from the data
      passportPicture: undefined,
    };
    
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(memberData),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(j.error || "Create failed");
    }
    const json = (await res.json()) as { data: Member };
    return json.data;
  }

  return (
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
  );
}

export default function NewMemberPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New Member</h1>
        <p className="text-sm text-muted-foreground">
          Create a new member record.
        </p>
      </div>

      <FormWithBanner>
        <MemberFormWithActions />
      </FormWithBanner>
    </div>
  );
}
