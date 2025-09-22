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

type Plan = {
  id: string;
  name: string;
  amount: number;
  currency: string;
};

type PaymentRow = {
  id: string;
  memberId: string;
  memberName: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paidAt: string; // YYYY-MM-DD
  reference?: string;
  createdAt: string;
};

export default function PaymentsReportPage() {
  // filters
  const [from, setFrom] = useState<string>(""); // YYYY-MM-DD
  const [to, setTo] = useState<string>("");
  const [memberQ, setMemberQ] = useState<string>("");
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<string>("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<string>("");

  // amount filters (client side)
  const [minAmt, setMinAmt] = useState<string>("");
  const [maxAmt, setMaxAmt] = useState<string>("");

  const selectedMember = useMemo(
    () => memberOptions.find((m) => m.id === memberId) ?? null,
    [memberOptions, memberId]
  );

  // data
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // printable
  const printRef = useRef<HTMLDivElement>(null);

  // load plans
  useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then((r) => r.json())
      .then((j) => setPlans(j.data));
  }, []);

  // member search (debounced)
  useEffect(() => {
    const t = setTimeout(async () => {
      const url = memberQ.trim()
        ? `/api/members?q=${encodeURIComponent(memberQ.trim())}`
        : "/api/members";
      const r = await fetch(url);
      const j = await r.json();
      setMemberOptions(j.data);
    }, 250);
    return () => clearTimeout(t);
  }, [memberQ]);

  const load = async () => {
    setLoading(true);
    const url = new URL(`${location.origin}/api/subscriptions/payments`);
    if (from) url.searchParams.set("from", from);
    if (to) url.searchParams.set("to", to);
    if (memberId) url.searchParams.set("memberId", memberId);
    if (planId) url.searchParams.set("planId", planId);

    const r = await fetch(url);
    const j = await r.json();
    setRows(j.data as PaymentRow[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let data = rows.slice();
    const min = Number(minAmt || "0");
    const max = Number(maxAmt || "0");
    if (!Number.isNaN(min) && min > 0)
      data = data.filter((d) => d.amount >= min);
    if (!Number.isNaN(max) && max > 0)
      data = data.filter((d) => d.amount <= max);
    return data;
  }, [rows, minAmt, maxAmt]);

  const currency = filtered[0]?.currency ?? "GHS";
  const total = filtered.reduce((s, r) => s + r.amount, 0);

  const exportCSV = () => {
    const header = [
      "Date",
      "Member",
      "Plan",
      "Amount",
      "Currency",
      "Reference",
    ];
    const lines = filtered.map((r) => [
      r.paidAt,
      r.memberName,
      r.planName,
      r.amount.toFixed(2),
      r.currency,
      r.reference ?? "",
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    downloadBlob(
      csv,
      `payments_${from || "all"}_${to || "all"}.csv`,
      "text/csv;charset=utf-8;"
    );
  };

  const exportPDF = async () => {
    const el = printRef.current;
    if (!el) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 10,
      filename: `payments_${from || "all"}_${to || "all"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };
    await html2pdf().from(el).set(opt).save();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Payments Report</h1>
        <p className="text-sm text-muted-foreground">
          View and export recorded payments over a period.
        </p>
      </header>

      {/* Filters */}
      <div className="border-2 rounded-md p-4 overflow-x-auto">
        <section className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <Label>From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <Label>To</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div>
            <Label>Plan</Label>
            <Select
              value={planId || "unset"}
              onValueChange={(v) => setPlanId(v === "unset" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Any plan</SelectItem>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.amount} {p.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Min Amount</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={minAmt}
              onChange={(e) => setMinAmt(e.target.value)}
            />
          </div>
          <div>
            <Label>Max Amount</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={maxAmt}
              onChange={(e) => setMaxAmt(e.target.value)}
            />
          </div>

          <div className="grid md:col-span-6 ">
            <Label>Search Member</Label>
            <Input
              placeholder="Type name, email or level"
              value={memberQ}
              onChange={(e) => setMemberQ(e.target.value)}
            />
            <div className="mt-2 border rounded-md max-h-48 overflow-auto">
              {memberOptions.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">
                  No members
                </div>
              ) : (
                <ul className="text-sm">
                  <li
                    className={`px-3 py-2 cursor-pointer hover:bg-accent ${
                      memberId === "" ? "bg-accent" : ""
                    }`}
                    onClick={() => setMemberId("")}
                  >
                    All members
                  </li>
                  {memberOptions.map((m) => (
                    <li
                      key={m.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-accent ${
                        memberId === m.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setMemberId(m.id)}
                    >
                      {m.firstName} {m.lastName}{" "}
                      {m.level ? (
                        <span className="text-muted-foreground">
                          — {m.level}
                        </span>
                      ) : null}
                      <div className="text-xs text-muted-foreground">
                        {m.email}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Selected member display */}
            <div className="mt-2 text-xs text-muted-foreground">
              {memberId ? (
                <>
                  Selected:&nbsp;
                  <span className="font-medium">
                    {selectedMember?.firstName} {selectedMember?.lastName}
                  </span>
                  {selectedMember?.level ? (
                    <> — {selectedMember.level}</>
                  ) : null}
                  {selectedMember?.email ? (
                    <> &middot; {selectedMember.email}</>
                  ) : null}
                </>
              ) : (
                <>
                  Selected: <span className="font-medium">All members</span>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-6 flex gap-2">
            <Button onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Apply"}
            </Button>
            <Button
              variant="secondary"
              onClick={exportCSV}
              disabled={!filtered.length}
            >
              Export CSV
            </Button>
            <Button onClick={exportPDF} disabled={!filtered.length}>
              Export PDF
            </Button>
          </div>
        </section>
      </div>

      {/* Report body (print/PDF target) */}
      <section
        ref={printRef}
        className="bg-white border rounded-md overflow-x-auto"
      >
        {filtered.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">
            No payments found.
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Header info */}
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Payments Report</h2>
                <div className="text-sm text-muted-foreground">
                  Period:{" "}
                  <b>
                    {from || "…"} → {to || "…"}
                  </b>
                </div>
                {memberId && (
                  <div className="text-xs text-muted-foreground">
                    Member ID: {memberId}
                  </div>
                )}
              </div>
              <div className="text-sm text-right">
                <div>
                  <b>Total</b>: {total.toFixed(2)} {currency}
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
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Member</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3">Currency</th>
                  <th className="text-left p-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.paidAt}</td>
                    <td className="p-3">{r.memberName}</td>
                    <td className="p-3">{r.planName}</td>
                    <td className="p-3 text-right">{r.amount.toFixed(2)}</td>
                    <td className="p-3">{r.currency}</td>
                    <td className="p-3">{r.reference || "-"}</td>
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
