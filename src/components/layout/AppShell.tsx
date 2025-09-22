// src/components/layout/AppShell.tsx
"use client";
import { useState } from "react";
import AppTopbar from "@/components/layout/AppTopbar";
import AppSidebar from "@/components/layout/AppSidebar";
import type { AppRole } from "@/lib/getRole";

export default function AppShell({
  children,
  role = "GUEST",
  name,
}: {
  children: React.ReactNode;
  role?: AppRole;
  name?: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <AppTopbar onMenu={() => setOpen(true)} role={role} name={name} />
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="flex gap-6 py-4 h-[calc(100dvh-3.5rem)] overflow-hidden">
          <AppSidebar open={open} onClose={() => setOpen(false)} role={role} />
          <main className="flex-1 h-full overflow-y-auto [scrollbar-gutter:stable]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
