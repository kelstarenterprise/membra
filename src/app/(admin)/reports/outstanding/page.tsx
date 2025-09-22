"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level?: string | null;
};

type PendingRow = {
  id: string;
  memberId: string;
  memberName: string;
  level?: string | null;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  period: string;
  status: "PENDING" | "PAID" | "WAIVED";
  createdAt: string;
};

type Aggregated = {
  memberId: string;
  memberName: string;
  level: string | null;
  currency: string;
  items: number;
  total: number;
};

export default function OutstandingReportPage() {
  // filters
  const [period, setPeriod] = useState<string>(""); // exact, e.g. "2025-09"; leave empty for all
  const [level, setLevel] = useState<string>(""); // empty => all
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // data
  const [rows, setRows] = useState<PendingRow[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // load levels from members
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/members");
      const j = await r.json();
      const uniq = Array.from(
        new Set(
          (j.data as Member[])
            .map((m) => m.level)
            .filter((v: string | null | undefined) => v && v.trim().length > 0)
        )
      ) as string[];
      uniq.sort();
      setLevels(uniq);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    const url = new URL(
      `${location.origin}/api/subscriptions/member-subscriptions`
    );
    url.searchParams.set("status", "PENDING");
    if (period.trim()) url.searchParams.set("period", period.trim());
    if (level.trim()) url.searchParams.set("level", level.trim());

    const r = await fetch(url.toString());
    const j = await r.json();
    setRows(j.data as PendingRow[]);
    setLoading(false);
  };

  // aggregate by member
  const aggregated: Aggregated[] = useMemo(() => {
    const map = new Map<string, Aggregated>();
    for (const r of rows) {
      const key = r.memberId;
      const cur = map.get(key);
      if (!cur) {
        map.set(key, {
          memberId: r.memberId,
          memberName: r.memberName,
          level: r.level ?? null,
          currency: r.currency,
          items: 1,
          total: r.amount,
        });
      } else {
        cur.items += 1;
        cur.total += r.amount;
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.memberName.localeCompare(b.memberName)
    );
  }, [rows]);

  const grandTotal = aggregated.reduce((s, r) => s + r.total, 0);
  const currency = rows[0]?.currency ?? "GHS";

  const exportCSV = () => {
    const header = ["Member", "Level", "Items", "Total", "Currency"];
    const lines = aggregated.map((r) => [
      r.memberName,
      r.level ?? "",
      String(r.items),
      r.total.toFixed(2),
      r.currency,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    downloadBlob(
      csv,
      `outstanding_${period || "all"}_${level || "all-levels"}.csv`,
      "text/csv;charset=utf-8;"
    );
  };

  const exportPDF = async () => {
    const el = printRef.current;
    if (!el) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 10,
      filename: `outstanding_${period || "all"}_${level || "all-levels"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    await html2pdf().from(el).set(opt).save();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Outstanding Balances</h1>
        <p className="text-sm text-muted-foreground">
          See members with pending dues; filter by period, level, or all members
          and export.
        </p>
      </header>

      {/* Filters */}
      <section className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <Label>Period (YYYY-MM)</Label>
          <Input
            placeholder="e.g., 2025-09"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>

        <div>
          <Label>Level</Label>
          <Select
            value={level || "unset"}
            onValueChange={(v) => setLevel(v === "unset" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">All levels</SelectItem>
              {levels.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-4 flex items-end gap-2">
          <Button onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Apply"}
          </Button>
          <Button
            variant="secondary"
            onClick={exportCSV}
            disabled={!aggregated.length}
          >
            Export CSV
          </Button>
          <Button onClick={exportPDF} disabled={!aggregated.length}>
            Export PDF
          </Button>
        </div>
      </section>

      {/* Report body (print/PDF target) */}
      <section
        ref={printRef}
        className="bg-white border rounded-md overflow-x-auto"
      >
        {aggregated.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">
            No outstanding balances found.
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Header info */}
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Outstanding Balances</h2>
                <div className="text-sm text-muted-foreground">
                  Period: <b>{period || "All"}</b> &middot; Level:{" "}
                  <b>{level || "All"}</b>
                </div>
              </div>
              <div className="text-sm text-right">
                <div>
                  <b>Grand Total:</b> {grandTotal.toFixed(2)} {currency}
                </div>
                <div className="text-xs text-muted-foreground">
                  Generated: {new Date().toLocaleString()}
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Member</th>
                  <th className="text-left p-3">Level</th>
                  <th className="text-right p-3">Items</th>
                  <th className="text-right p-3">Total Pending</th>
                </tr>
              </thead>
              <tbody>
                {aggregated.map((r) => (
                  <tr key={r.memberId} className="border-t">
                    <td className="p-3">{r.memberName}</td>
                    <td className="p-3">{r.level ?? "-"}</td>
                    <td className="p-3 text-right">{r.items}</td>
                    <td className="p-3 text-right">
                      {r.total.toFixed(2)} {r.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Optional: show raw pending lines (expandable) */}
            {/* You can add a Details accordion per member if you'd like */}
          </div>
        )}
      </section>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          header,
          nav,
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}

function escapeCsv(v: string) {
  if (v == null) return "";
  const needs = /[",\n]/.test(v);
  return needs ? `"${v.replace(/"/g, '""')}"` : v;
}
function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
