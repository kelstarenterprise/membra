"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
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
  paidAt: string;
  reference?: string;
  createdAt: string;
};

export default function AdminPaymentsPage() {
  // search + select member
  const [q, setQ] = useState("");
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<string>("");

  // select plan
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<string>("");

  // amount, date, ref
  const [amount, setAmount] = useState<string>("");
  const [paidAt, setPaidAt] = useState<string>(""); // YYYY-MM-DD
  const [reference, setReference] = useState<string>("");

  // recent payments
  const [recent, setRecent] = useState<PaymentRow[]>([]);
  const [saving, setSaving] = useState(false);

  // search members (debounced)
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

  // load plans + recent payments
  const loadPlans = async () => {
    const r = await fetch("/api/subscriptions/plans");
    const j = await r.json();
    setPlans(j.data);
  };
  const loadRecent = async () => {
    const r = await fetch("/api/subscriptions/payments");
    const j = await r.json();
    setRecent(j.data.slice(0, 10));
  };
  useEffect(() => {
    loadPlans();
    loadRecent();
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === planId),
    [plans, planId]
  );

  const resetForm = () => {
    setMemberId("");
    setPlanId("");
    setAmount("");
    setPaidAt("");
    setReference("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !planId || !amount || !paidAt) return;

    setSaving(true);
    const body = {
      memberId,
      planId,
      amount: Number(amount),
      paidAt,
      reference: reference.trim() || undefined,
    };

    const r = await fetch("/api/subscriptions/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (r.ok) {
      resetForm();
      loadRecent();
      alert("Payment saved.");
    } else {
      const j = await r.json();
      alert(j.error || "Failed to save payment");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Record Payment</h1>
        <p className="text-sm text-muted-foreground">
          Search member, select dues type, enter amount & date, then save.
        </p>
      </div>

      {/* Form */}
      <div className="border-2 rounded-md p-4 overflow-x-auto">
        <form onSubmit={submit} className="space-y-4">
          {/* Member search & select */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Search Member</Label>
              <Input
                placeholder="Type name, email, or level (e.g., 'Ama', 'Gold')"
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
                  Selected Member:{" "}
                  {memberOptions.find((x) => x.id === memberId)?.firstName}{" "}
                  {memberOptions.find((x) => x.id === memberId)?.lastName}
                </div>
              ) : null}
            </div>

            {/* Plan select */}
            <div>
              <Label>Type of Dues</Label>
              <Select
                value={planId || "unset"}
                onValueChange={(v) => setPlanId(v === "unset" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">— Select —</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.amount} {p.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount, date, reference */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={
                  selectedPlan ? String(selectedPlan.amount) : "0.00"
                }
              />
            </div>
            <div>
              <Label>Date Paid</Label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Reference (optional)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt / MoMo ref / Bank slip"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving || !memberId || !planId || !amount || !paidAt}
            >
              {saving ? "Saving…" : "Save Payment"}
            </Button>
          </div>
        </form>
      </div>

      {/* Recent payments */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Recent Payments</h2>
        <div className="border rounded-md overflow-x-auto">
          {recent.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground">
              No payments yet.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Member</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Ref</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.memberName}</td>
                    <td className="p-3">{r.planName}</td>
                    <td className="p-3 text-right">
                      {r.amount.toFixed(2)} {r.currency}
                    </td>
                    <td className="p-3">{r.paidAt}</td>
                    <td className="p-3">{r.reference || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
