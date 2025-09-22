"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  level?: string | null;
  status: "PROSPECT" | "PENDING" | "ACTIVE" | "SUSPENDED";
  residentialAddress?: string;
  occupation?: string;
  nationality?: string;
  outstandingBalance?: number;
  createdAt: string;
};

export default function MembersReportPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const url = q.trim()
      ? `/api/members?q=${encodeURIComponent(q.trim())}`
      : "/api/members";
    const r = await fetch(url);
    const j = await r.json();
    setRows(j.data as Member[]);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCSV = () => {
    const header = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Level",
      "Status",
      "Outstanding Balance",
    ];
    const lines = rows.map((m) => [
      m.firstName,
      m.lastName,
      m.email,
      m.phone ?? "",
      m.level ?? "",
      m.status,
      (m.outstandingBalance ?? 0).toString(),
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    downloadBlob(csv, "members.csv", "text/csv;charset=utf-8;");
  };

  const exportPDF = async () => {
    const el = printRef.current;
    if (!el) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 10,
      filename: "members.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    await html2pdf().from(el).set(opt).save();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Members List</h1>
        <p className="text-sm text-muted-foreground">
          Browse, search, and export the full member list.
        </p>
      </header>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label>Search</Label>
          <Input
            placeholder="Type name, email, or level"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Apply"}
        </Button>
        <Button variant="secondary" onClick={exportCSV} disabled={!rows.length}>
          Export CSV
        </Button>
        <Button onClick={exportPDF} disabled={!rows.length}>
          Export PDF
        </Button>
      </div>

      <section
        ref={printRef}
        className="bg-white border rounded-md overflow-x-auto"
      >
        {rows.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">
            No members found.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Level</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">
                    {m.firstName} {m.lastName}
                  </td>
                  <td className="p-3">{m.email}</td>
                  <td className="p-3">{m.phone ?? "-"}</td>
                  <td className="p-3">{m.level ?? "-"}</td>
                  <td className="p-3">{m.status}</td>
                  <td className="p-3 text-right">
                    {(m.outstandingBalance ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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
