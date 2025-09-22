// src/components/layout/AppTopbar.tsx
"use client";
import type { AppRole } from "@/lib/getRole";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, UserCircle } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AppTopbar({
  onMenu,
  role = "GUEST",
  name,
}: {
  onMenu?: () => void;
  role?: AppRole;
  name?: string | null | undefined;
}) {
  const isAuthed = role !== "GUEST";
  return (
    <header className="h-14 bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenu}
            aria-label="Open menu"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">MembershipManager</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserCircle className="h-5 w-5" />{" "}
          {name ?? (isAuthed ? "User" : "Guest")}
          {isAuthed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
