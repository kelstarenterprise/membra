"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  FileBarChart,
  User,
  LogIn,
  Package,
  WalletCards,
  LucideIcon,
  UserPlus,
  RefreshCcw,
  BanknoteArrowUp,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import type { AppRole } from "@/lib/getRole";

function NavItem({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 ${
        active ? "bg-gray-100 font-medium" : "text-gray-700"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function SidebarNav({ role }: { role: AppRole }) {
  if (role === "ADMIN") {
    return (
      <>
        <div className="text-xs uppercase text-gray-500 px-3 mb-2">Admin</div>
        <nav className="space-y-1">
          <NavItem href="/dashboard" label="Dashboard" Icon={LayoutDashboard} />
          <NavItem href="/members" label="Members" Icon={Users} />
          <NavItem href="/dues/plans" label="Dues Plans" Icon={Package} />
          <NavItem
            href="/dues/posting"
            label="Access Dues"
            Icon={WalletCards}
          />
          <NavItem
            href="/dues/payments"
            label="Record Payment"
            Icon={BanknoteArrowUp}
          />
          <NavItem
            href="/reports/dashboard"
            label="Reports"
            Icon={FileBarChart}
          />
          <NavItem href="/users" label="Users" Icon={UserPlus} />
        </nav>
      </>
    );
  }
  if (role === "MEMBER") {
    return (
      <>
        <div className="text-xs uppercase text-gray-500 px-3 mb-2">Member</div>
        <nav className="space-y-1">
          <NavItem href="/dashboard" label="Dashboard" Icon={LayoutDashboard} />
          <NavItem href="/statement" label="My Statement" Icon={PiggyBank} />
          <NavItem href="/profile" label="Profile" Icon={User} />
          <NavItem
            href="/profile/changepassword"
            label="Change Password"
            Icon={RefreshCcw}
          />
        </nav>
      </>
    );
  }
  return (
    <>
      <div className="text-xs uppercase text-gray-500 px-3 mb-2">Guest</div>
      <nav className="space-y-1">
        <NavItem href="/login" label="Login" Icon={LogIn} />
      </nav>
    </>
  );
}

export default function AppSidebar({
  open,
  onClose,
  role = "GUEST",
}: {
  open?: boolean;
  onClose?: () => void;
  role?: AppRole;
}) {
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden md:block w-64 shrink-0 border-r bg-white h-[calc(100dvh-3.5rem)] overflow-y-auto">
        <div className="p-3">
          <SidebarNav role={role} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={!!open} onOpenChange={(v) => !v && onClose?.()}>
        <SheetTrigger className="hidden" />
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="p-3 border-b">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="p-3">
            <SidebarNav role={role} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
