"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Pagination from "@/components/ui/pagination";
import { Users, UserSearch } from "lucide-react";
import type { MembersListResponse, MemberWithCategory } from "@/types/members";

export default function MembersTable() {
  const router = useRouter();

  const [rows, setRows] = useState<MemberWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Safe number coercion + "GHS 0.00" formatting
  const toNumber = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    // Handle Prisma Decimal objects
    if (v && typeof v === 'object' && 'toNumber' in v) {
      return (v as { toNumber(): number }).toNumber();
    }
    // Try to convert to number as fallback
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const formatGhs = (v: unknown) => {
    const num = toNumber(v);
    return `GHS ${num.toFixed(2)}`;
  };

  async function apiList(
    page: number,
    size: number,
    searchQuery?: string
  ): Promise<MembersListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (searchQuery?.trim()) {
      params.set("q", searchQuery.trim());
    }

    const res = await fetch(`/api/members?${params.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`GET /api/members ${res.status}`);
    return (await res.json()) as MembersListResponse;
  }
  async function apiDelete(id: string) {
    const res = await fetch(`/api/members/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("delete failed");
  }

  const load = useCallback(async () => {
    try {
      setErr(null);
      setLoading(true);
      const response = await apiList(currentPage, pageSize, search);
      setRows(response.data);
      setTotalItems(response.paging.total);
      setTotalPages(response.paging.pages);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Since we're using server-side pagination, we don't need client-side filtering
  const filtered = rows;

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="relative">
        <div className="relative bg-card border rounded-2xl p-8 shadow-elegant hover-lift">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">
                    Members Management
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Manage your organization&apos;s member database
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>Total: {totalItems} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push("/members/new")}
                className="btn-primary"
                size="lg"
              >
                <UserSearch className="w-5 h-5 mr-2" />
                <span>New Member</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search Section */}
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm font-medium text-foreground mb-2 block">
              Search Members
            </Label>
            <div className="relative">
              <UserSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, email, phone, or status..."
                className="pl-10 focus-ring-green"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          {search && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Found {totalItems} result{totalItems !== 1 ? 's' : ''}</span>
              <button
                onClick={() => handleSearchChange('')}
                className="text-primary hover:text-primary/80 underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {err && <p className="text-sm text-red-600">Error: {err}</p>}

      <div className="overflow-x-auto border rounded-xl bg-card shadow-elegant">
        <table className="min-w-full text-sm">
          <thead className="table-header-green border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-border last:border-r-0">
                Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-border last:border-r-0">
                Email
              </th>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-border last:border-r-0">
                Phone
              </th>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-border last:border-r-0">
                Level
              </th>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-border last:border-r-0">
                Status
              </th>
              <th className="px-4 py-3 text-right font-semibold text-sm border-r border-border last:border-r-0">
                Outstanding
              </th>
              <th className="px-4 py-3 text-right font-semibold text-sm w-40">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td className="px-3 py-6" colSpan={7}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-6" colSpan={7}>
                  No members found.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="bg-card hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2 text-foreground font-medium">
                    {m.firstName} {m.lastName}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{m.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.phone ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.memberCategory?.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className="status-success inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(() => {
                      const balance = toNumber(m.outstandingBalance);
                      const formattedBalance = formatGhs(m.outstandingBalance);
                      
                      if (balance === 0) {
                        return (
                          <span className="text-accent font-medium">
                            {formattedBalance}
                          </span>
                        );
                      } else if (balance > 0 && balance <= 50) {
                        return (
                          <span className="text-yellow-600 font-medium">
                            {formattedBalance}
                          </span>
                        );
                      } else {
                        return (
                          <span className="text-destructive font-medium">
                            {formattedBalance}
                          </span>
                        );
                      }
                    })()
                  }</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`members/${m.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (!confirm("Delete this member?")) return;
                          await apiDelete(m.id);
                          await load();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
