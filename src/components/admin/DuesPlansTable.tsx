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
import { CreditCard, Plus } from "lucide-react";

export default function DuesPlansTable() {
  const [rows, setRows] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Safe number coercion + "GHS 0.00" formatting
  const toNumber = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const formatGhs = (v: unknown) => `GHS ${toNumber(v).toFixed(2)}`;

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
      {/* Professional Header */}
      <div className="relative">
        <div className="relative bg-card border rounded-2xl p-8 shadow-elegant hover-lift">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <CreditCard className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">
                    Subscription Plans
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Create and manage dues/subscription plans
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>Total: {rows.length} plans</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create form */}
      <div className="border rounded-xl p-6 shadow-sm bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Plus className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-primary">Create New Plan</h2>
        </div>
        <form
          onSubmit={createPlan}
          className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
        >
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-primary">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Monthly Dues"
              className="border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-primary">Code</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="DUES-MONTH"
              className="border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-primary">Amount (GHS)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              className="border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-primary">Billing Cycle</Label>
            <Select
              value={form.billingCycle}
              onValueChange={(v) => setForm((f) => ({ ...f, billingCycle: v }))}
            >
              <SelectTrigger className="border-border focus:ring-primary focus:border-primary">
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
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!form.name || !form.code || !form.amount}
            >
              Add Plan
            </Button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-x-auto shadow-sm bg-card">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No plans yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Currency</th>
                <th className="text-left p-3 font-medium">Cycle</th>
                <th className="text-left p-3 font-medium">Active</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted transition-colors">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.code}</td>
                  <td className="p-3 text-right font-medium"> {formatGhs(r.amount)}</td>
                  <td className="p-3">{r.currency}</td>
                  <td className="p-3">{r.billingCycle}</td>
                  <td className="p-3">
                    {r.active ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
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