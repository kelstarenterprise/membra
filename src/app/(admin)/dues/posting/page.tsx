"use client";

import DuesPostingForm from "@/components/admin/DuesPostingForm";
import { FormWithBanner } from "@/components/forms/FormBanner";

export default function PostingPage() {
  return (
    <FormWithBanner>
      <DuesPostingForm />
    </FormWithBanner>
  );
}
