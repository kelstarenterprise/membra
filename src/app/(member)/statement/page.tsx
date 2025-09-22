"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

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

export default function MyStatementPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [subs, setSubs] = useState<MemberSub[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // detect current member (prefers /api/members/me; falls back to ?memberId=)
  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) Try /api/members/me (recommended after auth wiring)
      let me: Member | null = null;
      try {
        const r = await fetch("/api/members/me");
        if (r.ok) {
          const j = await r.json();
          me = j.data as Member;
        }
      } catch {
        /* ignore */
      }

      // 2) Fallback: check URL ?memberId= for local testing
      if (!me) {
        const sp = new URLSearchParams(location.search);
        const fallbackId = sp.get("memberId") ?? "";
        if (fallbackId) {
          const r = await fetch(
            `/api/members?q=${encodeURIComponent(fallbackId)}`
          );
          const j = await r.json();
          const found =
            (j.data as Member[]).find((m) => m.id === fallbackId) ??
            (j.data as Member[])[0]; // if searching by email/name
          if (found) me = found;
        }
      }

      // 3) If still no member, stop here
      if (!me) {
        setMember(null);
        setSubs([]);
        setPays([]);
        setLoading(false);
        return;
      }

      setMember(me);

      // fetch statement data
      const [sr, pr] = await Promise.all([
        fetch(`/api/subscriptions/member-subscriptions?memberId=${me.id}`),
        fetch(`/api/subscriptions/payments?memberId=${me.id}`),
      ]);
      const sj = await sr.json();
      const pj = await pr.json();
      setSubs(sj.data as MemberSub[]);
      setPays(pj.data as Payment[]);
      setLoading(false);
    })();
  }, []);

  const currency = subs[0]?.currency || pays[0]?.currency || "GHS";

  const totalAssessed = useMemo(
    () => subs.reduce((s, r) => s + r.amount, 0),
    [subs]
  );
  const totalPaid = useMemo(
    () => pays.reduce((s, r) => s + r.amount, 0),
    [pays]
  );
  const balance = totalAssessed - totalPaid;

  const handlePrint = () => window.print();

  const handleExportPdf = async () => {
    const el = printRef.current;
    if (!el) return;
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf()
      .from(el)
      .set({
        margin: 10,
        filename: `statement_${
          member ? `${member.firstName}_${member.lastName}` : "member"
        }.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .save();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">My Statement</h1>
        <p className="text-sm text-muted-foreground">
          View your assessed dues and payments.
        </p>
      </header>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={handlePrint}
          disabled={!member || loading}
        >
          Print
        </Button>
        <Button onClick={handleExportPdf} disabled={!member || loading}>
          Export PDF
        </Button>
      </div>

      {/* Main content */}
      <section ref={printRef} className="bg-white border rounded-md">
        {loading ? (
          <div className="p-6">Loading…</div>
        ) : !member ? (
          <div className="p-6 text-sm text-muted-foreground">
            We couldn’t detect your account. If you’re testing locally, append
            <code className="mx-1">?memberId=m1</code> to the URL.
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header block */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {member.firstName} {member.lastName}
                </h2>
                <div className="text-sm text-muted-foreground">
                  {member.email}
                </div>
                {member.level ? (
                  <div className="text-sm text-muted-foreground">
                    Level: {member.level}
                  </div>
                ) : null}
              </div>
              <div className="text-right text-sm">
                <div>
                  <b>Date:</b> {new Date().toLocaleString()}
                </div>
              </div>
            </div>

            {/* Summary cards */}
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

            {/* Assessed Dues */}
            <section className="space-y-2">
              <h3 className="font-semibold">Assessed Dues</h3>
              <div className="border rounded-md overflow-x-auto">
                {subs.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No assessed dues.
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3">Period</th>
                        <th className="text-left p-3">Plan</th>
                        <th className="text-right p-3">Amount</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Assessed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.map((r) => (
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
                {pays.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No payments recorded.
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
                      {pays.map((p) => (
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

            <div className="text-xs text-muted-foreground pt-4">
              Generated by ClubManager • {new Date().toLocaleString()}
            </div>
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
