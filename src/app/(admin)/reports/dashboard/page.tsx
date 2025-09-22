"use client";

import Link from "next/link";
import { cn } from "@/lib/utils"; // if you have a cn helper; otherwise remove cn()
import {
  FileText,
  Receipt,
  Users,
  AlertCircle,
} from "lucide-react";

type ReportLink = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items: ReportLink[] = [
  {
    title: "Member Statement",
    description: "Generate, print, or export a member’s statement.",
    href: "/dues/statements",
    icon: FileText,
  },
  {
    title: "Payments Report",
    description: "View and export recorded payments over a period.",
    href: "/reports/payments", // create this route
    icon: Receipt,
  },
  {
    title: "Members List",
    description: "Browse, search, and export the full member list.",
    href: "/reports/members",
    icon: Users,
  },
  {
    title: "Outstanding Balances",
    description:
      "See members with pending dues; filter by period or level and export.",
    href: "/reports/outstanding", // create this route
    icon: AlertCircle,
  },
];

export default function ReportsMenuPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Quick access to statements, payment reports, member lists, and
          balances.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <ReportCard key={item.title} {...item} />
        ))}
      </section>
    </div>
  );
}

function ReportCard({ title, description, href, icon: Icon }: ReportLink) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block rounded-2xl border p-5 transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl border p-3">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
