"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type UserRow = {
  id: string;
  email: string;
  username: string;
  role: "ADMIN" | "MEMBER";
  memberId?: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  } | null;
};

type MemberLite = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
};

export default function UsersAdminPage() {
  // listing state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // create form state
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [password, setPassword] = useState("ChangeMe123!");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberOptions, setMemberOptions] = useState<MemberLite[]>([]);
  const [memberId, setMemberId] = useState<string>("");

  async function loadUsers() {
    try {
      setErr(null);
      setLoading(true);
      const r = await fetch("/api/users", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load users");
      setUsers(j.data as UserRow[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // member search (debounced)
  useEffect(() => {
    const t = setTimeout(async () => {
      const url = memberQuery.trim()
        ? `/api/members?q=${encodeURIComponent(memberQuery.trim())}&limit=20`
        : `/api/members?limit=20`;
      try {
        const r = await fetch(url, { cache: "no-store" });
        const j = await r.json();
        if (r.ok) {
          const list = (j.data as Array<{ id: string; firstName: string; lastName: string; email?: string | null }>).map((m) => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email ?? null,
          })) as MemberLite[];
          setMemberOptions(list);
        }
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [memberQuery]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      [
        u.username,
        u.email,
        u.role,
        u.member?.firstName ?? "",
        u.member?.lastName ?? "",
        u.member?.email ?? "",
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(s))
    );
  }, [users, q]);

  async function createUser() {
    const payload = {
      email: email.trim(),
      username: username.trim(),
      role,
      memberId: memberId || null,
      password: password.trim(),
    };
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j.error || "Failed to create user");
      return;
    }
    // reset + reload
    setEmail("");
    setUsername("");
    setRole("MEMBER");
    setPassword("ChangeMe123!");
    setMemberId("");
    setMemberQuery("");
    await loadUsers();
  }

  async function removeUser(id: string) {
    if (!confirm("Delete this user?")) return;
    const r = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j.error || "Failed to delete user");
      return;
    }
    await loadUsers();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage application users. Link a user to a Member for
          member self-service.
        </p>
      </header>

      {/* Create form */}
      <section className="border rounded-md p-4 space-y-3">
        <h2 className="font-semibold">Create User</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., kwame"
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "ADMIN" | "MEMBER")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">MEMBER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Default Password</Label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ChangeMe123!"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Will be hashed on the server. Ask user to change after first
              login.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label>Link to Member (optional)</Label>
            <Input
              placeholder="Search by name or email…"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
            />
            <div className="mt-2 border rounded max-h-40 overflow-auto">
              <ul className="text-sm">
                <li
                  className={`px-3 py-2 cursor-pointer hover:bg-accent ${
                    !memberId ? "bg-accent" : ""
                  }`}
                  onClick={() => setMemberId("")}
                >
                  No linkage
                </li>
                {memberOptions.map((m) => {
                  const label = `${m.firstName} ${m.lastName} ${
                    m.email ? `— ${m.email}` : ""
                  }`;
                  return (
                    <li
                      key={m.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-accent ${
                        memberId === m.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setMemberId(m.id)}
                    >
                      {label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <Button
            onClick={createUser}
            disabled={!email.trim() || !username.trim() || !password.trim()}
          >
            Create User
          </Button>
        </div>
      </section>

      {/* List + search */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Label>Search</Label>
          <Input
            className="max-w-xs"
            placeholder="username, email, role or member…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {err && <div className="text-sm text-rose-600">Error: {err}</div>}

        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">Username</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Linked Member</th>
                <th className="text-left p-2">Created</th>
                <th className="text-right p-2 w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={6}>
                    No users.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.username}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2">
                      {u.member
                        ? `${u.member.firstName} ${u.member.lastName}`
                        : "—"}
                    </td>
                    <td className="p-2">
                      {new Date(u.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeUser(u.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
