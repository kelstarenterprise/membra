"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

/* ========= Data types ========= */
type ApiSingle<T> = { data: T };
type ApiList<T> = { data: T[] };

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

      let me: Member | null = null;

      // 1) Try /api/members/me
      try {
        const r = await fetch("/api/members/me");
        if (r.ok) {
          const j: ApiSingle<Member> = await r.json();
          me = j.data;
        }
      } catch {
        // ignore network errors
      }

      // 2) Fallback via query param search
      if (!me) {
        const sp = new URLSearchParams(location.search);
        const fallbackId = sp.get("memberId") ?? "";
        if (fallbackId) {
          const r = await fetch(
            `/api/members?q=${encodeURIComponent(fallbackId)}`
          );
          const j: ApiList<Member> = await r.json();
          const found = j.data.find((m) => m.id === fallbackId) ?? j.data[0];
          if (found) me = found;
        }
      }

      // 3) If still no member, stop
      if (!me) {
        setMember(null);
        setSubs([]);
        setPays([]);
        setLoading(false);
        return;
      }

      setMember(me);

      // fetch statement data for member
      const [sr, pr] = await Promise.all([
        fetch(`/api/subscriptions/member-subscriptions?memberId=${me.id}`),
        fetch(`/api/subscriptions/payments?memberId=${me.id}`),
      ]);

      const sj: ApiList<MemberSub> = await sr.json();
      const pj: ApiList<Payment> = await pr.json();

      setSubs(sj.data);
      setPays(pj.data);
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
    if (!member) return;
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 30;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Member Statement', margin, yPos);
      yPos += 15;

      // Member info (right aligned)
      const memberInfo = [
        `Member: ${member.firstName} ${member.lastName}`,
        member.level ? `Level: ${member.level}` : null,
        `Email: ${member.email}`,
        `Date: ${new Date().toLocaleDateString()}`
      ].filter(Boolean) as string[];

      memberInfo.forEach((info, index) => {
        const textWidth = doc.getTextWidth(info);
        doc.text(info, pageWidth - margin - textWidth, 30 + (index * 5));
      });

      yPos += 15;

      // Summary boxes
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const boxWidth = (pageWidth - margin * 2 - 20) / 3;
      const boxHeight = 25;
      
      // Total Assessed box
      doc.rect(margin, yPos, boxWidth, boxHeight);
      doc.text('Total Assessed', margin + 5, yPos + 8);
      doc.setFontSize(14);
      doc.text(`${totalAssessed.toFixed(2)} ${currency}`, margin + 5, yPos + 18);
      
      // Total Paid box
      doc.setFontSize(10);
      doc.rect(margin + boxWidth + 10, yPos, boxWidth, boxHeight);
      doc.text('Total Paid', margin + boxWidth + 15, yPos + 8);
      doc.setFontSize(14);
      doc.text(`${totalPaid.toFixed(2)} ${currency}`, margin + boxWidth + 15, yPos + 18);
      
      // Balance box
      doc.setFontSize(10);
      doc.rect(margin + (boxWidth + 10) * 2, yPos, boxWidth, boxHeight);
      doc.text('Balance', margin + (boxWidth + 10) * 2 + 5, yPos + 8);
      doc.setFontSize(14);
      const balanceColor = balance >= 0 ? [0, 0, 0] : [220, 53, 69]; // Red for negative
      doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
      doc.text(`${balance.toFixed(2)} ${currency}`, margin + (boxWidth + 10) * 2 + 5, yPos + 18);
      doc.setTextColor(0, 0, 0); // Reset to black
      
      yPos += boxHeight + 20;

      // Assessed Dues Table
      if (subs.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Assessed Dues', margin, yPos);
        yPos += 15;

        // Table headers
        doc.setFontSize(9);
        const colWidths = [30, 60, 30, 25, 35];
        const headers = ['Period', 'Plan', 'Amount', 'Status', 'Assessed On'];
        let xPos = margin;
        
        // Header background
        doc.setFillColor(239, 246, 255);
        doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, 'F');
        
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          doc.text(header, xPos + 2, yPos + 5);
          xPos += colWidths[index];
        });
        yPos += 12;

        // Table rows
        doc.setFont('helvetica', 'normal');
        subs.forEach((sub, rowIndex) => {
          if (yPos > 250) { // New page if needed
            doc.addPage();
            yPos = 30;
          }
          
          xPos = margin;
          const rowData = [
            sub.period,
            sub.planName,
            `${sub.amount.toFixed(2)} ${sub.currency}`,
            sub.status,
            new Date(sub.createdAt).toLocaleDateString()
          ];
          
          // Alternate row background
          if (rowIndex % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, 'F');
          }
          
          rowData.forEach((data, index) => {
            if (index === 2) { // Amount column - right align
              const textWidth = doc.getTextWidth(data);
              doc.text(data, xPos + colWidths[index] - textWidth - 2, yPos + 5);
            } else {
              doc.text(data, xPos + 2, yPos + 5);
            }
            xPos += colWidths[index];
          });
          yPos += 12;
        });
        
        yPos += 10;
      }

      // Payments Table
      if (pays.length > 0) {
        if (yPos > 200) { // New page if needed
          doc.addPage();
          yPos = 30;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Payments', margin, yPos);
        yPos += 15;

        // Table headers
        doc.setFontSize(9);
        const colWidths = [35, 70, 35, 40];
        const headers = ['Date', 'Plan', 'Amount', 'Reference'];
        let xPos = margin;
        
        // Header background
        doc.setFillColor(239, 246, 255);
        doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, 'F');
        
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          doc.text(header, xPos + 2, yPos + 5);
          xPos += colWidths[index];
        });
        yPos += 12;

        // Table rows
        doc.setFont('helvetica', 'normal');
        pays.forEach((payment, rowIndex) => {
          if (yPos > 250) { // New page if needed
            doc.addPage();
            yPos = 30;
          }
          
          xPos = margin;
          const rowData = [
            payment.paidAt,
            payment.planName,
            `${payment.amount.toFixed(2)} ${payment.currency}`,
            payment.reference || '-'
          ];
          
          // Alternate row background
          if (rowIndex % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, 'F');
          }
          
          rowData.forEach((data, index) => {
            if (index === 2) { // Amount column - right align
              const textWidth = doc.getTextWidth(data);
              doc.text(data, xPos + colWidths[index] - textWidth - 2, yPos + 5);
            } else {
              doc.text(data, xPos + 2, yPos + 5);
            }
            xPos += colWidths[index];
          });
          yPos += 12;
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated by ClubManager • ${new Date().toLocaleString()}`,
        margin,
        doc.internal.pageSize.getHeight() - 10
      );

      const filename = `statement_${member.firstName}_${member.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }
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
                    <thead className="bg-blue-50/80 text-blue-900 border-b border-blue-100">
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
                    <thead className="bg-blue-50/80 text-blue-900 border-b border-blue-100">
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
