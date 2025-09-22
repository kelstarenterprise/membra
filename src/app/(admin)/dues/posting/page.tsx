"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MemberSubscription,
  SubscriptionPlan,
  TARGET_TYPE,
  TargetType,
} from "@/types/subscription";
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
import { Member } from "@/types/member";

export default function PostingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [planId, setPlanId] = useState("");
  const [period, setPeriod] = useState(""); // e.g., "2025-09"
  const [targetType, setTargetType] = useState<TargetType>("LEVEL");
  const [targetLevel, setTargetLevel] = useState<string>("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const levels = useMemo(
    () =>
      Array.from(
        new Set(members.map((m) => m.level).filter(Boolean))
      ) as string[],
    [members]
  );

  const targetsPreviewCount = useMemo(() => {
    if (targetType === "LEVEL") {
      return members.filter((m) => (m.level ?? "") === (targetLevel ?? ""))
        .length;
    }
    return members.filter((m) => memberIds.includes(m.id)).length;
  }, [members, targetType, targetLevel, memberIds]);

  const fetchData = async () => {
    setLoading(true);
    const [p, m] = await Promise.all([
      fetch("/api/subscriptions/plans").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]);
    setPlans(p.data);
    setMembers(m.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedPlan = plans.find((p) => p.id === planId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !period) return;

    const body = {
      planId,
      planName: selectedPlan?.name ?? "",
      period,
      targetType,
      targetLevel: targetType === "LEVEL" ? targetLevel : null,
      memberIds: targetType === "INDIVIDUAL" ? memberIds : [],
    };

    const r = await fetch("/api/subscriptions/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      // reset
      setTargetLevel("");
      setMemberIds([]);
      alert("Dues assessed successfully!");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assess Dues</h1>
        <p className="text-sm text-muted-foreground">
          Link a subscription plan to a group (by membership level) or selected
          individuals for a given period.
        </p>
      </div>
      <div className="border-2 rounded-md p-4 overflow-x-auto">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.amount} {p.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Period</Label>
              {/* For monthly dues, use YYYY-MM (plain text keeps it flexible) */}
              <Input
                placeholder="2025-09"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                e.g., 2025-09 (monthly) or 2025 (yearly)
              </p>
            </div>

            <div>
              <Label>Target Type</Label>
              <Select
                value={targetType}
                onValueChange={(v) => setTargetType(v as TargetType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPE.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === "LEVEL" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Membership Level</Label>
                <Select value={targetLevel} onValueChange={setTargetLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex items-end">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{targetsPreviewCount}</span>{" "}
                  member(s) will be assessed.
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label>Select Members (hold Ctrl/Cmd to multi-select)</Label>
              <select
                multiple
                className="w-full border rounded-md p-2 h-48"
                value={memberIds}
                onChange={(e) =>
                  setMemberIds(
                    Array.from(e.target.selectedOptions).map((o) => o.value)
                  )
                }
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} {m.level ? `— ${m.level}` : ""}
                  </option>
                ))}
              </select>
              <div className="text-sm text-muted-foreground mt-2">
                <span className="font-medium">{targetsPreviewCount}</span>{" "}
                member(s) selected.
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={!planId || !period}>
              Assess Dues
            </Button>
          </div>
        </form>
      </div>
      {/* Optional: quick view of latest member subscriptions */}
      <RecentSubs />
    </div>
  );
}

function RecentSubs() {
  const [rows, setRows] = useState<MemberSubscription[]>([]);
  useEffect(() => {
    fetch("/api/subscriptions/member-subscriptions")
      .then((r) => r.json())
      .then((j) => setRows(j.data.slice(0, 10)));
  }, []);
  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Recent Assessments</h2>
      <div className="border rounded-md overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Member</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-left p-3">Period</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.memberName}</td>
                <td className="p-3">{r.planName}</td>
                <td className="p-3 text-right">
                  {r.amount.toFixed(2)} {r.currency}
                </td>
                <td className="p-3">{r.period}</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
