"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/providers/toast-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  );
}
