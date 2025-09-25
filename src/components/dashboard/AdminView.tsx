"use client";

import { useState, useEffect } from "react";
import KPIWidgets from "@/components/shared/KPIWidgets";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatMemberStatus, formatMembershipLevel } from "@/lib/dashboard";

interface DashboardStats {
  kpiCards: Array<{
    label: string;
    value: number | string;
  }>;
  recentMembers: Array<{
    id: string;
    name: string;
    status: string;
    membershipLevel: string;
    joinedAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    method: string;
    paidAt: string;
    description?: string;
    memberName: string;
  }>;
}

export default function AdminView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/dashboard/stats');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error}. Please refresh the page or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Professional Background */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 rounded-xl p-6 shadow-sm border border-blue-600">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-blue-100">
            {loading ? 'Loading dashboard data...' : 'Real-time membership and financial overview'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border-blue-200 shadow-sm p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <KPIWidgets items={stats?.kpiCards || []} />
      )}

      {/* Recent Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Recent Members
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentMembers?.length ? (
                stats.recentMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatMembershipLevel(member.membershipLevel)} • {formatMemberStatus(member.status)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-blue-600 text-center py-4">No recent members found</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Recent Payments
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentPayments?.length ? (
                stats.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{payment.memberName}</p>
                      <p className="text-sm text-gray-500">
                        {payment.method} • {new Date(payment.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {payment.currency} {payment.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-blue-600 text-center py-4">No recent payments found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
