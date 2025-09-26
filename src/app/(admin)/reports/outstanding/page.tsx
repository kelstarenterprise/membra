"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
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
  const [period, setPeriod] = useState<string>(""); // "YYYY-MM", empty => all
  const [level, setLevel] = useState<string>(""); // empty => all
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // data
  const [rows, setRows] = useState<PendingRow[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // load levels from members (unique, sorted)
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/members");
      const j = await r.json();
      const uniq = Array.from(
        new Set(
          (j.data as Member[])
            .map((m) => m.level)
            .filter(
              (v: string | null | undefined): v is string =>
                !!v && v.trim().length > 0
            )
        )
      );
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

  // aggregate by member (no 'any')
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
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 30;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Outstanding Balances Report', margin, yPos);
      yPos += 10;

      // Filters info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const filterText = `Period: ${period || 'All'} | Level: ${level || 'All'} | Generated: ${new Date().toLocaleDateString()}`;
      doc.text(filterText, margin, yPos);
      yPos += 20;

      // Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Outstanding: ${grandTotal.toFixed(2)} ${currency}`, margin, yPos);
      doc.text(`Members with Outstanding: ${aggregated.length}`, pageWidth - margin - 60, yPos);
      yPos += 20;

      // Table headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const colWidths = [60, 40, 20, 30, 20];
      const headers = ['Member', 'Level', 'Items', 'Total', 'Currency'];
      let xPos = margin;
      
      // Header background
      doc.setFillColor(239, 68, 68, 0.1); // Red background for outstanding
      doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, 'F');
      
      headers.forEach((header, index) => {
        doc.text(header, xPos + 2, yPos + 5);
        xPos += colWidths[index];
      });
      yPos += 12;

      // Table rows
      doc.setFont('helvetica', 'normal');
      aggregated.forEach((member, rowIndex) => {
        if (yPos > 250) { // New page if needed
          doc.addPage();
          yPos = 30;
        }
        
        xPos = margin;
        const rowData = [
          member.memberName,
          member.level ?? '-',
          member.items.toString(),
          member.total.toFixed(2),
          member.currency
        ];
        
        // Alternate row background
        if (rowIndex % 2 === 1) {
          doc.setFillColor(254, 242, 242); // Light red for outstanding
          doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, 'F');
        }
        
        rowData.forEach((data, index) => {
          if (index === 2 || index === 3) { // Items and Total columns - right align
            const textWidth = doc.getTextWidth(data);
            doc.text(data, xPos + colWidths[index] - textWidth - 2, yPos + 5);
          } else {
            // Truncate long text to fit in column
            const maxWidth = colWidths[index] - 4;
            let text = data;
            while (doc.getTextWidth(text) > maxWidth && text.length > 0) {
              text = text.substring(0, text.length - 1);
            }
            if (text !== data && text.length > 3) {
              text = text.substring(0, text.length - 3) + '...';
            }
            doc.text(text, xPos + 2, yPos + 5);
          }
          xPos += colWidths[index];
        });
        yPos += 12;
      });

      // Footer with summary
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text(`Grand Total: ${grandTotal.toFixed(2)} ${currency}`, margin, yPos);

      // Page footers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Generated by ClubManager • ${new Date().toLocaleString()}`,
          margin,
          doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin - doc.getTextWidth(`Page ${i} of ${pageCount}`),
          doc.internal.pageSize.getHeight() - 10
        );
      }

      const filename = `outstanding_${period || "all"}_${level || "all-levels"}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }
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
              <thead className="bg-blue-50/80 text-blue-900 border-b border-blue-100">
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
