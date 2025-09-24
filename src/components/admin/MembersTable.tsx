"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Member } from "@/types/member";

export default function MembersTable() {
  const router = useRouter();

  const [rows, setRows] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  async function apiList(): Promise<Member[]> {
    const res = await fetch("/api/members", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`GET /api/members ${res.status}`);
    const json = (await res.json()) as { data: Member[] };
    return json.data;
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
      const data = await apiList();
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.firstName,
        r.lastName,
        r.email,
        r.phone ?? "",
        r.status,
        r.level ?? "",
      ].some((f) => f?.toLowerCase().includes(q))
    );
  }, [rows, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Members</h1>
        <Button onClick={() => router.push("/members/new")}>New Member</Button>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="search" className="text-sm text-blue-700">
          Search
        </Label>
        <Input
          id="search"
          placeholder="Name, email, status…"
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {err && <p className="text-sm text-red-600">Error: {err}</p>}

      <div className="overflow-x-auto border rounded-xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50/80 text-blue-900 border-b border-blue-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-blue-100 last:border-r-0">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-blue-100 last:border-r-0">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-blue-100 last:border-r-0">Phone</th>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-blue-100 last:border-r-0">Level</th>
              <th className="px-4 py-3 text-left font-semibold text-sm border-r border-blue-100 last:border-r-0">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-sm border-r border-blue-100 last:border-r-0">Outstanding</th>
              <th className="px-4 py-3 text-right font-semibold text-sm w-40">Actions</th>
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
                <tr key={m.id} className="bg-white hover:bg-blue-50">
                  <td className="px-3 py-2">
                    {m.firstName} {m.lastName}
                  </td>
                  <td className="px-3 py-2">{m.email}</td>
                  <td className="px-3 py-2">{m.phone ?? "—"}</td>
                  <td className="px-3 py-2">{m.level ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatGhs(m.outstandingBalance)}
                  </td>
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
    </div>
  );
}
