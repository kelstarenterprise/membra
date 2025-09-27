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
import MemberSearch from "@/components/shared/MemberSearch";
import { Member } from "@/types/member";
import { useFormBannerActions } from "@/components/forms/FormBanner";
import { RefreshCw, UserPlus, Users } from "lucide-react";

type MemberCategory = {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
};

export default function DuesPostingForm() {
  const { success, error, warning } = useFormBannerActions();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [categories, setCategories] = useState<MemberCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Form state
  const [planId, setPlanId] = useState("");
  const [period, setPeriod] = useState(""); // e.g., "2025-09"
  const [targetType, setTargetType] = useState<TargetType>("CATEGORY");
  const [targetCategory, setTargetCategory] = useState<string>("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const targetsPreviewCount = useMemo(() => {
    if (targetType === "CATEGORY") {
      return members.filter((m) => m.memberCategory?.name === targetCategory)
        .length;
    }
    return memberIds.length;
  }, [members, targetType, targetCategory, memberIds]);

  const fetchData = async () => {
    setLoading(true);
    const [p, c, m] = await Promise.all([
      fetch("/api/subscriptions/plans").then((r) => r.json()),
      fetch("/api/member-categories").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]);
    setPlans(p.data);
    setCategories(c.data);
    setMembers(m.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedPlan = plans.find((p) => p.id === planId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !period) {
      warning(
        "Incomplete Form",
        "Please select a plan and enter a period to continue."
      );
      return;
    }

    // Additional validation
    if (targetType === "CATEGORY" && !targetCategory) {
      warning(
        "Category Required",
        "Please select a member category to assign dues."
      );
      return;
    }

    if (targetType === "INDIVIDUAL" && memberIds.length === 0) {
      warning(
        "Members Required",
        "Please select at least one member to assign dues."
      );
      return;
    }

    const body = {
      planId,
      planName: selectedPlan?.name ?? "",
      period,
      targetType,
      targetCategory: targetType === "CATEGORY" ? targetCategory : null,
      memberIds: targetType === "INDIVIDUAL" ? memberIds : [],
    };

    console.log("Submitting assessment request:", body);

    try {
      const r = await fetch("/api/subscriptions/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseData = await r.json();
      console.log("Assessment API response:", {
        status: r.status,
        data: responseData,
      });

      if (r.ok) {
        // reset form
        setTargetCategory("");
        setMemberIds([]);
        setPlanId("");
        setPeriod("");

        const assignedCount = responseData.data?.assignedDuesCount || 0;
        success(
          "Dues Assignment Successful",
          `Successfully assigned dues to ${assignedCount} member${
            assignedCount !== 1 ? "s" : ""
          }. The table has been updated with the latest assignments.`
        );

        // Trigger table refresh
        setRefreshTrigger((prev) => prev + 1);
      } else {
        console.error("Assessment failed:", responseData);
        error(
          "Assignment Failed",
          responseData.error ||
            "Unable to assign dues. Please check your input and try again."
        );
      }
    } catch (networkError) {
      console.error("Network error during assessment:", networkError);
      error(
        "Connection Error",
        "Unable to connect to the server. Please check your connection and try again."
      );
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
      {/* Professional Header */}
      <div className="relative">
        <div className="relative bg-card border rounded-2xl p-8 shadow-elegant hover-lift">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <UserPlus className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">
                    Dues Assignment
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Link a subscription plan to a group or selected individuals for a given period
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="border rounded-xl p-6 shadow-sm bg-card overflow-x-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-primary">Assign Dues to Members</h2>
        </div>
        
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-primary">Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger className="border-border focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{p.name}</span>
                        <span className="text-accent font-medium">{p.amount} {p.currency}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-primary">Period</Label>
              <Input
                placeholder="2025-09"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border-border focus:ring-primary focus:border-primary"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                e.g., 2025-09 (monthly) or 2025 (yearly)
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-primary">Target Type</Label>
              <Select
                value={targetType}
                onValueChange={(v) => setTargetType(v as TargetType)}
              >
                <SelectTrigger className="border-border focus:ring-primary focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPE.map((t) => (
                    <SelectItem key={t} value={t}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          t === "CATEGORY" ? "bg-accent" : "bg-primary"
                        }`}></span>
                        {t === "CATEGORY" ? "By Category" : "Individual Members"}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === "CATEGORY" ? (
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-primary">Member Category</Label>
                  <Select
                    value={targetCategory}
                    onValueChange={setTargetCategory}
                  >
                    <SelectTrigger className="border-border focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{category.name}</span>
                            {category.description && (
                              <span className="text-xs text-muted-foreground">
                                {category.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex items-end">
                  <div className="bg-secondary/50 px-3 py-2 rounded border border-border">
                    <div className="text-sm font-medium text-primary">
                      <span className="text-lg">{targetsPreviewCount}</span> member(s) will be assigned dues
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Category-based assignment
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <div className="mb-3">
                <Label className="text-sm font-medium text-primary">Individual Members</Label>
              </div>
              <MemberSearch
                selectedIds={memberIds}
                onSelectionChange={setMemberIds}
                label=""
                placeholder="Search members by name, email, or category"
                multiple={true}
              />
              <div className="mt-3 bg-secondary/50 px-3 py-2 rounded border border-border">
                <div className="text-sm font-medium text-primary">
                  <span className="text-lg">{memberIds.length}</span> member(s) selected for dues assignment
                </div>
                <div className="text-xs text-muted-foreground">
                  Individual member assignment
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {planId && period && (
                  <span>
                    Ready to assign {plans.find(p => p.id === planId)?.name} for period {period}
                  </span>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={!planId || !period} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 font-medium shadow-sm"
              >
                Assign Dues
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Recent Assessments */}
      <RecentSubs refreshTrigger={refreshTrigger} />
    </div>
  );
}

function RecentSubs({ refreshTrigger }: { refreshTrigger?: number }) {
  const [rows, setRows] = useState<MemberSubscription[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentSubs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subscriptions/member-subscriptions");
      if (response.ok) {
        const data = await response.json();
        setRows(data.data.slice(0, 5)); // Show latest 5
      }
    } catch (error) {
      console.error("Error fetching recent subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentSubs();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  if (rows.length === 0 && !loading) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Recent Assessments</h2>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="text-sm text-muted-foreground">Refreshing...</div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecentSubs}
            disabled={loading}
            className="text-xs border-accent hover:bg-accent/10"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>
      <div
        className={`border rounded-md overflow-x-auto transition-opacity duration-200 shadow-sm ${
          loading ? "opacity-50" : "opacity-100"
        }`}
      >
        <table className="min-w-full text-sm">
          <thead className="bg-secondary text-secondary-foreground border-b border-border">
            <tr>
              <th className="text-left p-3 font-medium">Member</th>
              <th className="text-left p-3 font-medium">Plan</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-left p-3 font-medium">Period</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-muted-foreground"
                >
                  Loading recent assessments...
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted transition-colors">
                  <td className="p-3 font-medium">{r.memberName}</td>
                  <td className="p-3">{r.planName}</td>
                  <td className="p-3 text-right font-medium">
                    {r.amount.toFixed(2)} {r.currency}
                  </td>
                  <td className="p-3">{r.period}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        r.status === "PAID"
                          ? "bg-accent/20 text-accent-foreground"
                          : r.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}