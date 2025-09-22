"use client";

import { useEffect, useState } from "react";
import { SubscriptionPlan, BILLING_CYCLE } from "@/types/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function PlansPage() {
  const [rows, setRows] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  // form state
  const [form, setForm] = useState({
    name: "",
    code: "",
    amount: "0",
    currency: "GHS",
    billingCycle: "ONE_TIME",
    active: "true",
  });

  const fetchPlans = async () => {
    setLoading(true);
    const r = await fetch("/api/subscriptions/plans");
    const j = await r.json();
    setRows(j.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: form.name,
      code: form.code,
      amount: Number(form.amount || 0),
      currency: form.currency,
      billingCycle: form.billingCycle,
      active: form.active === "true",
    };

    const r = await fetch("/api/subscriptions/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      setForm({
        name: "",
        code: "",
        amount: "0",
        currency: "GHS",
        billingCycle: "ONE_TIME",
        active: "true",
      });
      fetchPlans();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Subscription Plans</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage dues/subscription plans.
        </p>
      </div>

      {/* Create form */}
      <div className="border-2 rounded-md p-4">
        <form
          onSubmit={createPlan}
          className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
        >
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Monthly Dues"
            />
          </div>
          <div>
            <Label>Code</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="DUES-MONTH"
            />
          </div>
          <div>
            <Label>Amount (GHS)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Billing Cycle</Label>
            <Select
              value={form.billingCycle}
              onValueChange={(v) => setForm((f) => ({ ...f, billingCycle: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILLING_CYCLE.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={!form.name || !form.code || !form.amount}
            >
              Add Plan
            </Button>
          </div>
        </form>
      </div>
      {/* Table */}
      <div className="border-2 rounded-md overflow-x-auto">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No plans yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Code</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-left p-3">Currency</th>
                <th className="text-left p-3">Cycle</th>
                <th className="text-left p-3">Active</th>
                <th className="text-left p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.code}</td>
                  <td className="p-3 text-right">{r.amount.toFixed(2)}</td>
                  <td className="p-3">{r.currency}</td>
                  <td className="p-3">{r.billingCycle}</td>
                  <td className="p-3">{r.active ? "Yes" : "No"}</td>
                  <td className="p-3">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
