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
    <header className="h-14 bg-gradient-to-r from-green-600 via-green-500 to-green-600 border-b border-green-700 sticky top-0 z-40 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenu}
            aria-label="Open menu"
            className="md:hidden text-white hover:bg-green-700/50 hover:shadow-md transition-all"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-white text-lg tracking-wide">MEMBERSHIP MANAGER</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-green-50 bg-green-700/30 px-3 py-1.5 rounded-full">
            <UserCircle className="h-4 w-4 text-green-100" />
            <span className="font-medium">{name ?? (isAuthed ? "User" : "Guest")}</span>
          </div>
          {isAuthed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="border-white/30 text-white bg-primary/80 hover:bg-primary hover:text-white hover:border-white/50 hover:shadow-md transition-all font-medium"
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
