"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Printer, Download, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";

/** ───────── Types ───────── */
type ApiResponse<T> = { data: T };

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
  /** ───────── State ───────── */
  const [q, setQ] = useState("");
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<string>("");

  const [period, setPeriod] = useState<string>(""); // YYYY-MM
  const [year, setYear] = useState<string>(""); // YYYY

  const [subs, setSubs] = useState<MemberSub[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Printable area (only this will print/export)
  const printRef = useRef<HTMLDivElement>(null);

  /** ───────── Effects ───────── */
  // Debounced member search
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const url = q.trim()
          ? `/api/members?q=${encodeURIComponent(q.trim())}`
          : "/api/members";
        const r = await fetch(url);
        if (!r.ok) {
          console.error("Failed to fetch members:", r.statusText);
          setMemberOptions([]);
          return;
        }
        const j: ApiResponse<Member[]> = await r.json();
        setMemberOptions(j.data || []);
      } catch (e) {
        console.error("Error fetching members:", e);
        setMemberOptions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  /** ───────── Data load ───────── */
  const loadData = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const subUrl = new URL(
        `${location.origin}/api/subscriptions/member-subscriptions`
      );
      subUrl.searchParams.set("memberId", memberId);
      const payUrl = new URL(`${location.origin}/api/subscriptions/payments`);
      payUrl.searchParams.set("memberId", memberId);

      const [sr, pr] = await Promise.all([fetch(subUrl), fetch(payUrl)]);
      if (!sr.ok || !pr.ok) {
        console.error("Failed to fetch data:", {
          sub: sr.statusText,
          pay: pr.statusText,
        });
        setSubs([]);
        setPays([]);
        return;
      }
      const sj: ApiResponse<MemberSub[]> = await sr.json();
      const pj: ApiResponse<Payment[]> = await pr.json();
      setSubs(sj.data || []);
      setPays(pj.data || []);
    } catch (e) {
      console.error("Error loading statement data:", e);
      setSubs([]);
      setPays([]);
    } finally {
      setLoading(false);
    }
  };

  /** ───────── Derived ───────── */
  const selectedMember = useMemo(
    () => memberOptions.find((m) => m.id === memberId),
    [memberOptions, memberId]
  );

  const filteredSubs = useMemo(() => {
    let rows = subs.slice();
    if (period.trim()) rows = rows.filter((r) => r.period === period.trim());
    else if (year.trim())
      rows = rows.filter((r) => r.period.startsWith(year.trim()));
    return rows.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [subs, period, year]);

  const filteredPays = useMemo(() => {
    let rows = pays.slice();
    if (period.trim())
      rows = rows.filter((p) => (p.paidAt ?? "").slice(0, 7) === period.trim());
    else if (year.trim())
      rows = rows.filter((p) => (p.paidAt ?? "").slice(0, 4) === year.trim());
    return rows.sort(
      (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()
    );
  }, [pays, period, year]);

  const currency =
    filteredSubs[0]?.currency || filteredPays[0]?.currency || "GHS";
  const totalAssessed = filteredSubs.reduce((s, r) => s + r.amount, 0);
  const totalPaid = filteredPays.reduce((s, r) => s + r.amount, 0);
  const balance = totalAssessed - totalPaid;

  const hasStatement = filteredSubs.length > 0 || filteredPays.length > 0;

  /** ───────── Print only the area (hidden iframe) ───────── */
  const handlePrintArea = () => {
    const source = printRef.current;
    if (!source || !hasStatement) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
      document.body.removeChild(iframe);
      return;
    }

    // Copy styles so Tailwind/app CSS apply inside the print doc
    const headHTML = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((n) => (n as HTMLElement).outerHTML)
      .join("\n");

    const PRINT_CSS = `
      <style>
        @page { size: A4; margin: 12mm; }
        html, body { background:#fff; color:#111827; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #E5E7EB; padding: 7px 8px; font-size: 11px; }
        thead th { background:#EFF6FF; color:#1e3a8a; }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
      </style>
    `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>Member Statement</title>
          ${headHTML}
          ${PRINT_CSS}
        </head>
        <body>
          ${source.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
      try {
        win.focus();
        win.print();
      } finally {
        setTimeout(() => document.body.removeChild(iframe), 200);
      }
    };
  };

  /** ───────── Generate PDF directly with jsPDF (avoids CSS parsing issues) ───────── */
  const generatePdfContent = (doc: jsPDF): void => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 30;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Member Statement", margin, yPos);
    yPos += 10;

    // Period/Year info
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const periodText = period
      ? `Period: ${period}`
      : year
      ? `Year: ${year}`
      : "All-time";
    doc.text(periodText, margin, yPos);
    yPos += 15;

    // Member info (right aligned)
    const memberInfo = [
      `Member: ${selectedMember?.firstName} ${selectedMember?.lastName}`,
      selectedMember?.level ? `Level: ${selectedMember.level}` : null,
      `Email: ${selectedMember?.email}`,
      `Date: ${new Date().toLocaleDateString()}`,
    ].filter(Boolean) as string[];

    memberInfo.forEach((info, index) => {
      const textWidth = doc.getTextWidth(info);
      doc.text(info, pageWidth - margin - textWidth, 30 + index * 5);
    });

    yPos += 10;

    // Summary boxes
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const boxWidth = (pageWidth - margin * 2 - 20) / 3;
    const boxHeight = 25;

    // Total Assessed box
    doc.rect(margin, yPos, boxWidth, boxHeight);
    doc.text("Total Assessed", margin + 5, yPos + 8);
    doc.setFontSize(14);
    doc.text(`${totalAssessed.toFixed(2)} ${currency}`, margin + 5, yPos + 18);

    // Total Paid box
    doc.setFontSize(10);
    doc.rect(margin + boxWidth + 10, yPos, boxWidth, boxHeight);
    doc.text("Total Paid", margin + boxWidth + 15, yPos + 8);
    doc.setFontSize(14);
    doc.text(
      `${totalPaid.toFixed(2)} ${currency}`,
      margin + boxWidth + 15,
      yPos + 18
    );

    // Balance box
    doc.setFontSize(10);
    doc.rect(margin + (boxWidth + 10) * 2, yPos, boxWidth, boxHeight);
    doc.text("Balance", margin + (boxWidth + 10) * 2 + 5, yPos + 8);
    doc.setFontSize(14);
    const balanceColor = balance >= 0 ? [0, 0, 0] : [220, 53, 69]; // Red for negative
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(
      `${balance.toFixed(2)} ${currency}`,
      margin + (boxWidth + 10) * 2 + 5,
      yPos + 18
    );
    doc.setTextColor(0, 0, 0); // Reset to black

    yPos += boxHeight + 20;

    // Assessed Dues Table
    if (filteredSubs.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Assessed Dues", margin, yPos);
      yPos += 15;

      // Table headers
      doc.setFontSize(9);
      const colWidths = [30, 60, 30, 25, 35];
      const headers = ["Period", "Plan", "Amount", "Status", "Assessed On"];
      let xPos = margin;

      // Header background
      doc.setFillColor(239, 246, 255);
      doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, "F");

      doc.setFont("helvetica", "bold");
      headers.forEach((header, index) => {
        doc.text(header, xPos + 2, yPos + 5);
        xPos += colWidths[index];
      });
      yPos += 12;

      // Table rows
      doc.setFont("helvetica", "normal");
      filteredSubs.forEach((sub, rowIndex) => {
        if (yPos > 250) {
          // New page if needed
          doc.addPage();
          yPos = 30;
        }

        xPos = margin;
        const rowData = [
          sub.period,
          sub.planName,
          `${sub.amount.toFixed(2)} ${sub.currency}`,
          sub.status,
          new Date(sub.createdAt).toLocaleDateString(),
        ];

        // Alternate row background
        if (rowIndex % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, "F");
        }

        rowData.forEach((data, index) => {
          if (index === 2) {
            // Amount column - right align
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
    if (filteredPays.length > 0) {
      if (yPos > 200) {
        // New page if needed
        doc.addPage();
        yPos = 30;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Payments", margin, yPos);
      yPos += 15;

      // Table headers
      doc.setFontSize(9);
      const colWidths = [35, 70, 35, 40];
      const headers = ["Date", "Plan", "Amount", "Reference"];
      let xPos = margin;

      // Header background
      doc.setFillColor(239, 246, 255);
      doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, "F");

      doc.setFont("helvetica", "bold");
      headers.forEach((header, index) => {
        doc.text(header, xPos + 2, yPos + 5);
        xPos += colWidths[index];
      });
      yPos += 12;

      // Table rows
      doc.setFont("helvetica", "normal");
      filteredPays.forEach((payment, rowIndex) => {
        if (yPos > 250) {
          // New page if needed
          doc.addPage();
          yPos = 30;
        }

        xPos = margin;
        const rowData = [
          payment.paidAt,
          payment.planName,
          `${payment.amount.toFixed(2)} ${payment.currency}`,
          payment.reference || "-",
        ];

        // Alternate row background
        if (rowIndex % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, "F");
        }

        rowData.forEach((data, index) => {
          if (index === 2) {
            // Amount column - right align
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
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
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
  };

  /** ───────── Export PDF directly with jsPDF (no CSS parsing issues) ───────── */
  const handleExportPdf = async () => {
    console.log("Starting direct PDF export with jsPDF");

    if (!selectedMember || !hasStatement) {
      alert("No content to export");
      return;
    }

    setExportingPdf(true);

    try {
      // Create new PDF document
      const doc = new jsPDF();

      // Generate the PDF content programmatically
      generatePdfContent(doc);

      // Generate filename
      const filename = `statement_${
        selectedMember
          ? `${selectedMember.firstName}_${selectedMember.lastName}`
          : "member"
      }_${new Date().toISOString().split("T")[0]}.pdf`;

      console.log(`Saving PDF with filename: ${filename}`);

      // Save the PDF
      doc.save(filename);

      console.log("PDF export completed successfully");
    } catch (error: unknown) {
      console.error("PDF export failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      alert(`PDF export failed: ${message}`);
    } finally {
      setExportingPdf(false);
    }
  };


  /** ───────── UI ───────── */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Member Statement</h1>
        <p className="text-sm text-muted-foreground">
          Pick a member, choose a period or year, then Generate → Print/Export.
        </p>
      </div>

      {/* Controls (kept minimal) */}
      <div className="space-y-4 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Member search + select */}
          <div className="md:col-span-2">
            <Label>Search Member</Label>
            <Input
              placeholder="Type name, email or level"
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
              <div className="mt-2 text-base">
                Selected:{" "}
                <b>
                  {selectedMember?.firstName} {selectedMember?.lastName}
                </b>
              </div>
            ) : null}
          </div>

          {/* Filters */}
          <div>
            <Label>Period (YYYY-MM)</Label>
            <Input
              placeholder="e.g., 2025-09"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                if (e.target.value) setYear("");
              }}
            />
            <div className="mt-3">
              <Label>Year (YYYY)</Label>
              <Input
                placeholder="e.g., 2025"
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  if (e.target.value) setPeriod("");
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={loadData}
            disabled={!memberId || loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {loading ? "Loading…" : "Generate"}
          </Button>
          <Button
            variant="secondary"
            onClick={handlePrintArea}
            disabled={!hasStatement || loading}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleExportPdf}
            disabled={!hasStatement || loading || exportingPdf}
            className="flex items-center gap-2"
          >
            {exportingPdf ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportingPdf ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>

      <hr />

      {/* Printable area ONLY */}
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

            {/* Assessed Dues */}
            <section className="space-y-2">
              <h3 className="font-semibold">Assessed Dues</h3>
              <div className="border rounded-md overflow-x-auto">
                {filteredSubs.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No assessed dues for the selected range.
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
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
                          <td className="p-3 num">
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
                    <thead>
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
                          <td className="p-3 num">
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
      </div>

      {/* Print-only cleanup */}
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
