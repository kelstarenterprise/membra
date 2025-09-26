"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

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

type MemberSub = {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "WAIVED";
};

type Payment = {
  id: string;
  memberId: string;
  amount: number;
  currency: string;
};

// Helper functions
function formatOutstandingBalance(balance: number | undefined | null): string {
  if (balance == null || typeof balance !== 'number') {
    return '0.00';
  }
  return balance.toFixed(2);
}


export default function MembersReportPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const calculateOutstandingBalance = async (members: Member[]): Promise<Member[]> => {
    try {
      // Fetch all subscriptions and payments in parallel
      const [subsResponse, paymentsResponse] = await Promise.all([
        fetch('/api/subscriptions/member-subscriptions'),
        fetch('/api/subscriptions/payments')
      ]);

      if (!subsResponse.ok || !paymentsResponse.ok) {
        console.error('Failed to fetch subscription or payment data');
        return members;
      }

      const subsData = await subsResponse.json();
      const paymentsData = await paymentsResponse.json();
      
      const subscriptions: MemberSub[] = subsData.data || [];
      const payments: Payment[] = paymentsData.data || [];

      // Calculate outstanding balance for each member
      return members.map(member => {
        // Sum up all assessments for this member (both PENDING and PAID to get total assessed)
        const totalAssessed = subscriptions
          .filter(sub => sub.memberId === member.id)
          .reduce((sum, sub) => sum + sub.amount, 0);

        // Sum up all payments made by this member
        const totalPaid = payments
          .filter(payment => payment.memberId === member.id)
          .reduce((sum, payment) => sum + payment.amount, 0);

        // Calculate outstanding balance (total assessed - total paid)
        // Ensure it's never negative (members can't have negative outstanding balances)
        const outstandingBalance = Math.max(0, totalAssessed - totalPaid);

        return {
          ...member,
          outstandingBalance
        };
      });
    } catch (error) {
      console.error('Error calculating outstanding balances:', error);
      return members;
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = q.trim()
        ? `/api/members?q=${encodeURIComponent(q.trim())}`
        : "/api/members";
      const r = await fetch(url);
      const j = await r.json();
      const members = j.data as Member[];
      
      // Calculate outstanding balances
      const membersWithBalances = await calculateOutstandingBalance(members);
      setRows(membersWithBalances);
    } catch (error) {
      console.error('Error loading members:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
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
      formatOutstandingBalance(m.outstandingBalance),
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    downloadBlob(csv, "members.csv", "text/csv;charset=utf-8;");
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
      doc.text('Members Report', margin, yPos);
      yPos += 10;

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 20;

      // Table headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const colWidths = [35, 50, 25, 20, 25, 25];
      const headers = ['Name', 'Email', 'Phone', 'Level', 'Status', 'Outstanding'];
      let xPos = margin;
      
      // Header background
      doc.setFillColor(59, 130, 246, 0.1); // Blue background
      doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, 'F');
      
      headers.forEach((header, index) => {
        doc.text(header, xPos + 2, yPos + 5);
        xPos += colWidths[index];
      });
      yPos += 12;

      // Table rows
      doc.setFont('helvetica', 'normal');
      rows.forEach((member, rowIndex) => {
        if (yPos > 250) { // New page if needed
          doc.addPage();
          yPos = 30;
        }
        
        xPos = margin;
        const rowData = [
          `${member.firstName} ${member.lastName}`,
          member.email,
          member.phone ?? '-',
          member.level ?? '-',
          member.status,
          formatOutstandingBalance(member.outstandingBalance)
        ];
        
        // Alternate row background
        if (rowIndex % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, 'F');
        }
        
        rowData.forEach((data, index) => {
          if (index === 5) { // Outstanding column - right align
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

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
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

      doc.save('members-report.pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }
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
            <thead className="bg-blue-50/80 text-blue-900 border-b border-blue-100">
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
                    {formatOutstandingBalance(m.outstandingBalance)}
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
