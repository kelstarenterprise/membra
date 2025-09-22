"use client";
import React from "react";
import { useSession } from "next-auth/react";
import type { Role } from "@/lib/roles";

export default function Guard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const role = session?.user && 'role' in session.user ? session.user.role : undefined;
  if (!role || !allow.includes(role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Access denied</h2>
          <p className="text-sm text-gray-600 mt-2">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
