"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level?: string | null;
};

type MemberSub = {
  id: string;
  memberId: string;
  memberName: string;
  level?: string | null;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  period: string; // "YYYY-MM" or "YYYY"
  status: "PENDING" | "PAID" | "WAIVED";
  assessmentId: string;
  createdAt: string;
};

type Payment = {
  id: string;
  memberId: string;
  memberName: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paidAt: string; // "YYYY-MM-DD"
  reference?: string;
  createdAt: string;
};

export default function AdminMemberStatementPage() {
  // member search & select
  const [q, setQ] = useState("");
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<string>("");

  // filters
  const [period, setPeriod] = useState<string>(""); // e.g., "2025-09"
  const [year, setYear] = useState<string>(""); // e.g., "2025"

  // data
  const [subs, setSubs] = useState<MemberSub[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // printable
  const printRef = useRef<HTMLDivElement>(null);

  // load member options (debounced by 250ms)
  useEffect(() => {
    const t = setTimeout(async () => {
      const url = q.trim()
        ? `/api/members?q=${encodeURIComponent(q.trim())}`
        : "/api/members";
      const r = await fetch(url);
      const j = await r.json();
      setMemberOptions(j.data);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // load statement data for selected member
  const loadData = async () => {
    if (!memberId) return;
    setLoading(true);

    const subUrl = new URL(
      `${location.origin}/api/subscriptions/member-subscriptions`
    );
    subUrl.searchParams.set("memberId", memberId);
    // we’ll filter client-side by period/year for flexibility
    const payUrl = new URL(`${location.origin}/api/subscriptions/payments`);
    payUrl.searchParams.set("memberId", memberId);

    const [sr, pr] = await Promise.all([fetch(subUrl), fetch(payUrl)]);
    const sj = await sr.json();
    const pj = await pr.json();

    setSubs(sj.data as MemberSub[]);
    setPays(pj.data as Payment[]);
    setLoading(false);
  };

  // derived: selected member object
  const selectedMember = useMemo(
    () => memberOptions.find((m) => m.id === memberId),
    [memberOptions, memberId]
  );

  // client-side filtering
  const filteredSubs = useMemo(() => {
    let rows = subs.slice();
    if (period.trim()) {
      rows = rows.filter((r) => r.period === period.trim());
    } else if (year.trim()) {
      rows = rows.filter((r) => r.period.startsWith(year.trim()));
    }
    return rows.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [subs, period, year]);

  const filteredPays = useMemo(() => {
    let rows = pays.slice();
    if (period.trim()) {
      // match payment year-month to period if possible
      rows = rows.filter((p) => (p.paidAt ?? "").slice(0, 7) === period.trim());
    } else if (year.trim()) {
      rows = rows.filter((p) => (p.paidAt ?? "").slice(0, 4) === year.trim());
    }
    return rows.sort(
      (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()
    );
  }, [pays, period, year]);

  // totals
  const currency =
    filteredSubs[0]?.currency || filteredPays[0]?.currency || "GHS";
  const totalAssessed = filteredSubs.reduce((s, r) => s + r.amount, 0);
  const totalPaid = filteredPays.reduce((s, r) => s + r.amount, 0);
  // If you want to count only PAID subs (from assessments), you can add logic here.
  // We’ll treat assessed as charges and payments as receipts.
  const balance = totalAssessed - totalPaid;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    const el = printRef.current;
    if (!el) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 10,
      filename: `statement_${
        selectedMember
          ? `${selectedMember.firstName}_${selectedMember.lastName}`
          : "member"
      }.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };
    await html2pdf().from(el).set(opt).save();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Generate Member Statement</h1>
        <p className="text-sm text-muted-foreground">
          Search a member, pick a period or year, then print or export to PDF.
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Member search + pick */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label>Search Member</Label>
            <Input
              placeholder="Type name, email or level (e.g., 'Ama', 'Gold')"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="mt-2 border rounded-md max-h-56 overflow-auto">
              {memberOptions.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  No members
                </div>
              ) : (
                <ul className="text-sm">
                  {memberOptions.map((m) => (
                    <li
                      key={m.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-accent ${
                        memberId === m.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setMemberId(m.id)}
                    >
                      {m.firstName} {m.lastName}
                      {m.level ? (
                        <span className="text-muted-foreground">
                          {" "}
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
            {memberId ? (
              <div className="mt-1 text-2xl">
                Selected Member: {selectedMember?.firstName}{" "}
                {selectedMember?.lastName}
              </div>
            ) : null}
          </div>

          {/* Filters: period OR year */}
          <div>
            <Label>Period (YYYY-MM)</Label>
            <Input
              placeholder="e.g., 2025-09"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                if (e.target.value) setYear(""); // mutual exclusive
              }}
            />
            <div className="mt-3">
              <Label>Year (YYYY)</Label>
              <Input
                placeholder="e.g., 2025"
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  if (e.target.value) setPeriod(""); // mutual exclusive
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadData} disabled={!memberId || loading}>
            {loading ? "Loading…" : "Generate"}
          </Button>
          <Button
            variant="secondary"
            onClick={handlePrint}
            disabled={!memberId || loading}
          >
            Print
          </Button>
          <Button onClick={handleExportPdf} disabled={!memberId || loading}>
            Export PDF
          </Button>
        </div>
      </div>
      <hr></hr>
      {/* Printable area */}
      <div ref={printRef} className="bg-white print:bg-white border rounded-md">
        {!memberId ? (
          <div className="p-6 text-sm text-muted-foreground">
            Select a member and click Generate.
          </div>
        ) : loading ? (
          <div className="p-6">Generating…</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Member Statement</h2>
                <div className="text-sm">
                  {period ? (
                    <>
                      Period: <b>{period}</b>
                    </>
                  ) : year ? (
                    <>
                      Year: <b>{year}</b>
                    </>
                  ) : (
                    <>All-time</>
                  )}
                </div>
              </div>
              <div className="text-right text-sm">
                <div>
                  <b>Member:</b> {selectedMember?.firstName}{" "}
                  {selectedMember?.lastName}
                </div>
                {selectedMember?.level ? (
                  <div>
                    <b>Level:</b> {selectedMember?.level}
                  </div>
                ) : null}
                <div>
                  <b>Email:</b> {selectedMember?.email}
                </div>
                <div>
                  <b>Date:</b> {new Date().toLocaleString()}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-md p-4">
                <div className="text-sm text-muted-foreground">
                  Total Assessed
                </div>
                <div className="text-2xl font-semibold">
                  {totalAssessed.toFixed(2)} {currency}
                </div>
              </div>
              <div className="border rounded-md p-4">
                <div className="text-sm text-muted-foreground">Total Paid</div>
                <div className="text-2xl font-semibold">
                  {totalPaid.toFixed(2)} {currency}
                </div>
              </div>
              <div className="border rounded-md p-4">
                <div className="text-sm text-muted-foreground">Balance</div>
                <div className="text-2xl font-semibold">
                  {balance.toFixed(2)} {currency}
                </div>
              </div>
            </div>

            {/* Charges (assessed) */}
            <section className="space-y-2">
              <h3 className="font-semibold">Assessed Dues</h3>
              <div className="border rounded-md overflow-x-auto">
                {filteredSubs.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No assessed dues for the selected range.
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3">Period</th>
                        <th className="text-left p-3">Plan</th>
                        <th className="text-right p-3">Amount</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Assessed On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubs.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-3">{r.period}</td>
                          <td className="p-3">{r.planName}</td>
                          <td className="p-3 text-right">
                            {r.amount.toFixed(2)} {r.currency}
                          </td>
                          <td className="p-3">{r.status}</td>
                          <td className="p-3">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Payments */}
            <section className="space-y-2">
              <h3 className="font-semibold">Payments</h3>
              <div className="border rounded-md overflow-x-auto">
                {filteredPays.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No payments for the selected range.
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Plan</th>
                        <th className="text-right p-3">Amount</th>
                        <th className="text-left p-3">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPays.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-3">{p.paidAt}</td>
                          <td className="p-3">{p.planName}</td>
                          <td className="p-3 text-right">
                            {p.amount.toFixed(2)} {p.currency}
                          </td>
                          <td className="p-3">{p.reference || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <div className="text-xs text-muted-foreground pt-4 print:pt-2">
              Generated by ClubManager • {new Date().toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          header,
          footer,
          nav,
          .no-print,
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background: #fff !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
