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
    <header className="h-14 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 border-b border-blue-600 sticky top-0 z-40 shadow-sm backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenu}
            aria-label="Open menu"
            className="md:hidden text-white hover:bg-blue-600/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-white">MembershipManager</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-100">
          <UserCircle className="h-5 w-5 text-blue-200" />{" "}
          {name ?? (isAuthed ? "User" : "Guest")}
          {isAuthed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="border-blue-300 text-blue-100 hover:bg-blue-600/50 hover:text-white hover:border-blue-200"
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
