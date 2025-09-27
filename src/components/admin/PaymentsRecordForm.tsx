"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useFormBannerActions } from "@/components/forms/FormBanner";
import { RefreshCw, DollarSign, CreditCard } from "lucide-react";

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

type AssignedDue = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  plan: {
    id: string;
    name: string;
    amount: number;
    currency: string;
  };
  member: {
    id: string;
    firstName: string;
    lastName: string;
  };
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

export default function PaymentsRecordForm() {
  const { success, error } = useFormBannerActions();
  // search + select member
  const [q, setQ] = useState("");
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<string>("");
  const [searchFocused, setSearchFocused] = useState(false);

  // select plan - now member-specific assigned dues
  const [plans, setPlans] = useState<Plan[]>([]); // Keep for fallback
  const [assignedDues, setAssignedDues] = useState<AssignedDue[]>([]);
  const [selectedAssignedDueId, setSelectedAssignedDueId] = useState<string>("");
  const [planId, setPlanId] = useState<string>(""); // Keep for backward compatibility

  // amount, date, ref
  const [amount, setAmount] = useState<string>("");
  const [paidAt, setPaidAt] = useState<string>(""); // YYYY-MM-DD
  const [reference, setReference] = useState<string>("");

  // recent payments
  const [recent, setRecent] = useState<PaymentRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingAssignedDues, setLoadingAssignedDues] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [paymentProgress, setPaymentProgress] = useState<{
    totalPaid: number;
    dueAmount: number;
    status: 'PENDING' | 'PARTIAL' | 'PAID';
    currency: string;
  } | null>(null);
  const [loadingPaymentProgress, setLoadingPaymentProgress] = useState(false);

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

  // load assigned dues for selected member
  const loadMemberAssignedDues = async (selectedMemberId: string) => {
    if (!selectedMemberId) {
      setAssignedDues([]);
      setSelectedAssignedDueId("");
      setPlanId("");
      setPaymentProgress(null);
      return;
    }
    
    setLoadingAssignedDues(true);
    try {
      const response = await fetch(`/api/assigned-dues?memberId=${selectedMemberId}&status=PENDING,PARTIAL`);
      if (response.ok) {
        const data = await response.json();
        setAssignedDues(data.data || []);
        // Reset selections when member changes
        setSelectedAssignedDueId("");
        setPlanId("");
        setAmount(""); // Also reset amount as it should match the selected due
        setPaymentProgress(null); // Clear payment progress
      } else {
        console.error('Failed to fetch assigned dues:', response.statusText);
        setAssignedDues([]);
      }
    } catch (error) {
      console.error('Error fetching assigned dues:', error);
      setAssignedDues([]);
    } finally {
      setLoadingAssignedDues(false);
    }
  };
  const loadRecent = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const response = await fetch('/api/subscriptions/payments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.status}`);
      }

      const data = await response.json();
      setRecent((data.data || []).slice(0, 5)); // Take only the 5 most recent
    } catch (err) {
      console.error('Error fetching recent payments:', err);
      error('Failed to load recent payments');
    } finally {
      setLoadingRecent(false);
    }
  }, [error]);

  // Calculate payment progress for selected assigned due
  const calculatePaymentProgress = async (assignedDueId: string) => {
    if (!assignedDueId || !memberId) {
      setPaymentProgress(null);
      return;
    }

    setLoadingPaymentProgress(true);
    try {
      // Get assigned due details
      const assignedDue = assignedDues.find(d => d.id === assignedDueId);
      if (!assignedDue) {
        setPaymentProgress(null);
        return;
      }

      // Fetch ALL payments for this member and plan (dues type)
      const response = await fetch(`/api/subscriptions/payments?memberId=${memberId}&planId=${assignedDue.plan.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment progress');
      }

      const data = await response.json();
      const payments = data.data || [];
      
      // Calculate total paid for this dues type by this member
      const totalPaid = payments.reduce((sum: number, payment: { amount: number }) => sum + Number(payment.amount), 0);
      
      // Use the specific assigned due amount for this display
      const dueAmount = Number(assignedDue.amount);
      
      // Determine status based on this specific assigned due
      let status: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING';
      if (totalPaid >= dueAmount) {
        status = 'PAID';
      } else if (totalPaid > 0) {
        status = 'PARTIAL';
      }

      setPaymentProgress({
        totalPaid,
        dueAmount,
        status,
        currency: assignedDue.currency
      });

      // Update assigned due status in database if it has changed
      if (status !== assignedDue.status) {
        await updateAssignedDueStatus(assignedDueId, status);
        // Refresh assigned dues to reflect the status change
        if (memberId) {
          loadMemberAssignedDues(memberId);
        }
      }
    } catch (err) {
      console.error('Error calculating payment progress:', err);
      setPaymentProgress(null);
    } finally {
      setLoadingPaymentProgress(false);
    }
  };

  // Update assigned due status in database
  const updateAssignedDueStatus = async (assignedDueId: string, status: 'PENDING' | 'PARTIAL' | 'PAID') => {
    try {
      const response = await fetch('/api/assigned-dues/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedDueId,
          status
        })
      });

      if (!response.ok) {
        console.error('Failed to update assigned due status');
      }
    } catch (err) {
      console.error('Error updating assigned due status:', err);
    }
  };

  useEffect(() => {
    loadPlans();
    loadRecent();
  }, [refreshTrigger, loadRecent]);

  const selectedAssignedDue = useMemo(
    () => assignedDues.find((d) => d.id === selectedAssignedDueId),
    [assignedDues, selectedAssignedDueId]
  );

  const selectedPlan = useMemo(
    () => selectedAssignedDue?.plan || plans.find((p) => p.id === planId),
    [selectedAssignedDue, plans, planId]
  );

  const resetFormKeepMember = () => {
    // Reset form but keep member selection
    setSelectedAssignedDueId("");
    setPlanId("");
    setAmount("");
    setPaidAt("");
    setReference("");
    setPaymentProgress(null); // Clear payment progress
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields - we need either selectedAssignedDueId or planId
    const effectivePlanId = selectedAssignedDue?.plan?.id || planId;
    if (!memberId || !effectivePlanId || !amount || !paidAt) return;

    setSaving(true);
    const body = {
      memberId,
      planId: effectivePlanId,
      assignedDueId: selectedAssignedDueId || undefined, // Include assigned due ID if available
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
      const currentMemberId = memberId; // Store before reset
      const currentAssignedDueId = selectedAssignedDueId; // Store before reset
      resetFormKeepMember(); // Reset form but keep member selection
      setRefreshTrigger(prev => prev + 1); // Trigger refresh of recent payments
      // Refresh assigned dues for the same member
      if (currentMemberId) {
        loadMemberAssignedDues(currentMemberId); // Refresh their dues
      }
      // Recalculate payment progress if we had an assigned due selected
      if (currentAssignedDueId) {
        calculatePaymentProgress(currentAssignedDueId);
      }
      success("Payment saved successfully!");
    } else {
      const j = await r.json();
      error(j.error || "Failed to save payment");
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
                  <DollarSign className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">
                    Record Payment
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Search member, select dues type, enter amount & date, then save
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="border rounded-xl p-6 shadow-sm bg-card overflow-x-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/20 rounded-lg">
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-primary">Payment Details</h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Member search & select */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-primary">Search Member</Label>
              <Input
                placeholder="Type name, email, or level (e.g., 'Ama', 'Gold')"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  // Delay hiding to allow click events on list items to register
                  setTimeout(() => setSearchFocused(false), 150);
                }}
                className="border-border focus:ring-primary focus:border-primary"
              />
              {searchFocused && (
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
                        className={`px-3 py-2 cursor-pointer hover:bg-muted transition-colors ${
                          memberId === m.id ? "bg-accent/20" : ""
                        }`}
                        onClick={() => {
                          setMemberId(m.id);
                          loadMemberAssignedDues(m.id);
                          setSearchFocused(false); // Hide listbox after selection
                        }}
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
              )}
              {memberId ? (
                <div className="mt-1 text-sm text-primary bg-secondary/50 p-2 rounded">
                  Selected Member:{" "}
                  <span className="font-medium">
                    {memberOptions.find((x) => x.id === memberId)?.firstName}{" "}
                    {memberOptions.find((x) => x.id === memberId)?.lastName}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Member-specific assigned dues select */}
            <div>
              <Label className="text-sm font-medium text-primary">Type of Dues</Label>
              {!memberId ? (
                <Select disabled value="unset">
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Select member first" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Select member first</SelectItem>
                  </SelectContent>
                </Select>
              ) : loadingAssignedDues ? (
                <Select disabled value="loading">
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Loading dues..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loading">Loading assigned dues...</SelectItem>
                  </SelectContent>
                </Select>
              ) : assignedDues.length === 0 ? (
                <div className="space-y-2">
                  <Select disabled value="no-dues">
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="No pending dues found" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="no-dues">No pending or partial dues for this member</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    ℹ️ This member has no pending or partially paid dues. All assigned dues may already be fully paid, or you may need to assign dues first in the Dues Assignment section.
                  </p>
                </div>
              ) : (
                <Select
                  value={selectedAssignedDueId || "unset"}
                  onValueChange={(v) => {
                    if (v === "unset") {
                      setSelectedAssignedDueId("");
                      setAmount("");
                      setPaymentProgress(null);
                    } else {
                      setSelectedAssignedDueId(v);
                      const selectedDue = assignedDues.find(d => d.id === v);
                      if (selectedDue) {
                        setAmount(selectedDue.amount.toString());
                      }
                      // Calculate payment progress for this assigned due
                      calculatePaymentProgress(v);
                    }
                  }}
                >
                  <SelectTrigger className="border-border focus:ring-primary focus:border-primary">
                    <SelectValue placeholder="Select dues to pay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">— Select —</SelectItem>
                    {assignedDues.map((due) => {
                      const statusBadge = due.status === 'PENDING' ? '🟡' : due.status === 'PARTIAL' ? '🟠' : '🟢';
                      const dueDate = new Date(due.dueDate).toLocaleDateString();
                      return (
                        <SelectItem key={due.id} value={due.id}>
                          {statusBadge} {due.plan.name} — {due.amount} {due.currency} (Due: {dueDate})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Payment Progress Display */}
          {selectedAssignedDueId && (
            <div className="bg-muted/50 border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium text-primary">
                  Payment Progress for {selectedAssignedDue?.plan?.name || 'Selected Dues'}
                </h3>
                {loadingPaymentProgress && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {selectedAssignedDue && (
                <div className="text-xs text-muted-foreground mb-3">
                  Showing all payments by {memberOptions.find(m => m.id === memberId)?.firstName} {memberOptions.find(m => m.id === memberId)?.lastName} for {selectedAssignedDue.plan.name} dues
                  {(() => {
                    const sameTypeDues = assignedDues.filter(d => d.plan.id === selectedAssignedDue.plan.id);
                    if (sameTypeDues.length > 1) {
                      return (
                        <span className="block mt-1 text-accent">
                          📋 This member has {sameTypeDues.length} {selectedAssignedDue.plan.name} dues assigned
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
              {paymentProgress ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Due:</span>
                    <span className="font-medium">
                      {paymentProgress.dueAmount.toFixed(2)} {paymentProgress.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Amount Paid:</span>
                    <span className={`font-medium ${
                      paymentProgress.status === 'PAID' ? 'text-accent' :
                      paymentProgress.status === 'PARTIAL' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {paymentProgress.totalPaid.toFixed(2)} {paymentProgress.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Balance:</span>
                    <span className={`font-medium ${
                      (paymentProgress.dueAmount - paymentProgress.totalPaid) <= 0 ? 'text-accent' : 'text-destructive'
                    }`}>
                      {Math.max(0, paymentProgress.dueAmount - paymentProgress.totalPaid).toFixed(2)} {paymentProgress.currency}
                    </span>
                  </div>
                  <div className="mt-3 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        paymentProgress.status === 'PAID' ? 'bg-accent' :
                        paymentProgress.status === 'PARTIAL' ? 'bg-yellow-500' :
                        'bg-muted-foreground'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (paymentProgress.totalPaid / paymentProgress.dueAmount) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      paymentProgress.status === 'PAID' ? 'bg-accent/20 text-accent-foreground' :
                      paymentProgress.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {paymentProgress.status === 'PAID' ? '✅ Fully Paid' :
                       paymentProgress.status === 'PARTIAL' ? '⏳ Partially Paid' :
                       '⏸️ Pending Payment'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {((paymentProgress.totalPaid / paymentProgress.dueAmount) * 100).toFixed(1)}% completed
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Loading payment information...
                </div>
              )}
            </div>
          )}

          {/* Amount, date, reference */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-primary">Amount</Label>
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
                className="border-border focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-primary">Date Paid</Label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="border-border focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-primary">Reference (optional)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt / MoMo ref / Bank slip"
                className="border-border focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-end">
              <Button
                type="submit"
                disabled={saving || !memberId || (!selectedAssignedDueId && !planId) || !amount || !paidAt}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 font-medium shadow-sm"
              >
                {saving ? "Saving…" : "Save Payment"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Recent payments */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Recent Payments (5 most recent)</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loadingRecent}
            className="flex items-center gap-2 border-accent hover:bg-accent/10"
          >
            <RefreshCw className={`h-4 w-4 ${loadingRecent ? 'animate-spin' : ''}`} />
            {loadingRecent ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <div className="border rounded-xl overflow-x-auto shadow-sm bg-card">
          {loadingRecent ? (
            <div className="p-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading payments...
            </div>
          ) : recent.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground">
              No payments yet.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground border-b border-border">
                <tr>
                  <th className="text-left p-3 font-medium">Member</th>
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Ref</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted transition-colors">
                    <td className="p-3 font-medium">{r.memberName}</td>
                    <td className="p-3">{r.planName}</td>
                    <td className="p-3 text-right font-medium">
                      {r.amount.toFixed(2)} {r.currency}
                    </td>
                    <td className="p-3">{r.paidAt}</td>
                    <td className="p-3 text-muted-foreground">{r.reference || "-"}</td>
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