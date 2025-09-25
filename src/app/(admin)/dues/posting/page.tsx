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
import { FormWithBanner } from "@/components/forms/FormBanner";
import { useFormBannerActions } from "@/components/forms/FormBanner";
import { RefreshCw } from "lucide-react";

type MemberCategory = {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
};

function PostingFormContent() {
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
      <div>
        <h1 className="text-xl font-semibold">Dues Assignment</h1>
        <p className="text-sm text-muted-foreground">
          Link a subscription plan to a group (by member category) or selected
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
              <Label>Target Category</Label>
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
                      {t === "CATEGORY" ? "Category" : "Individual"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === "CATEGORY" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Category Level</Label>
                <Select
                  value={targetCategory}
                  onValueChange={setTargetCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                        {category.description && (
                          <span className="text-muted-foreground ml-2">
                            — {category.description}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex items-end">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{targetsPreviewCount}</span>{" "}
                  member(s) will be assigned dues.
                </div>
              </div>
            </div>
          ) : (
            <div>
              <MemberSearch
                selectedIds={memberIds}
                onSelectionChange={setMemberIds}
                label="Select Members"
                placeholder="Search members by name, email, or category"
                multiple={true}
              />
              <div className="text-sm text-muted-foreground mt-2">
                <span className="font-medium">{memberIds.length}</span>{" "}
                member(s) selected for dues assignment.
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={!planId || !period}>
              Add Dues/Subscription
            </Button>
          </div>
        </form>
      </div>
      {/* Optional: quick view of latest member subscriptions */}
      <RecentSubs refreshTrigger={refreshTrigger} />
    </div>
  );
}

export default function PostingPage() {
  return (
    <FormWithBanner>
      <PostingFormContent />
    </FormWithBanner>
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
        <h2 className="text-lg font-semibold">Recent Assessments</h2>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="text-sm text-muted-foreground">Refreshing...</div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecentSubs}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>
      <div
        className={`border rounded-md overflow-x-auto transition-opacity duration-200 ${
          loading ? "opacity-50" : "opacity-100"
        }`}
      >
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50/80 text-blue-900 border-b border-blue-100">
            <tr>
              <th className="text-left p-3">Member</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-left p-3">Period</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Created</th>
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
                <tr key={r.id} className="border-t hover:bg-gray-50">
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
                          ? "bg-green-100 text-green-800"
                          : r.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
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
