"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { Member } from "@/types/member";
import MemberForm, { MemberFormValues } from "@/components/admin/MemberForm";
import { useBanner } from "@/components/providers/banner-provider";

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [initial, setInitial] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useBanner();

  const apiGetOne = useCallback(async (): Promise<Member> => {
    const res = await fetch(`/api/members/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Load failed");
    const json = (await res.json()) as { data: Member };
    return json.data;
  }, [id]);
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

  async function apiUpdate(values: Partial<MemberFormValues>): Promise<Member> {
    // Handle file upload first if there's a new passport picture
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
      ...(passportPictureUrl && { passportPictureUrl }),
      // Remove the file object from the data
      passportPicture: undefined,
    };
    
    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(memberData),
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
        submitting={submitting}
        onSubmit={async (values) => {
          try {
            setSubmitting(true);
            const updatedMember = await apiUpdate(values);
            success(
              "Member Updated Successfully",
              `${updatedMember.firstName} ${updatedMember.lastName}'s details have been updated.`
            );
            
            // Small delay to show success message before redirecting
            setTimeout(() => {
              router.push("/members");
            }, 1500);
          } catch (error) {
            console.error("Error updating member:", error);
            showError(
              "Failed to Update Member",
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
