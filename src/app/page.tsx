// app/page.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  // Not signed in → show sign-in
  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="bg-white border rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
          <h1 className="text-lg font-semibold">
            Welcome to MembershipManager
          </h1>
          <p className="text-sm text-gray-600">Please sign in to continue.</p>
          <Link href="/login">
            <Button className="w-full">Sign in</Button>
          </Link>
          <p className="text-[11px] text-gray-500">
            Don’t have an account? Ask an admin to create one.
          </p>
        </div>
      </div>
    );
  }

  // Signed in → route by role
  const role =
    session.user && "role" in session.user
      ? (session.user.role as "ADMIN" | "MEMBER" | undefined)
      : undefined;
  const dashboardHref = role === "ADMIN" ? "/dashboard" : "/dashbaord";

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="bg-white border rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
        <h1 className="text-lg font-semibold">Welcome back</h1>
        <p className="text-sm text-gray-600">
          Signed in as <b>{session.user?.email ?? session.user?.name}</b>
        </p>
        <Link href={dashboardHref}>
          <Button className="w-full">
            Open {role === "ADMIN" ? "dashboard" : "dashboard"} Dashboard
          </Button>
        </Link>
        <p className="text-[11px] text-gray-500">
          Not you?{" "}
          <Link className="text-blue-600" href="/login">
            Switch account
          </Link>
        </p>
      </div>
    </div>
  );
}
