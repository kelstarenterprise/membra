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
      <header className="bg-secondary/50 p-6 rounded-lg shadow-sm border border-border">
        <h1 className="text-2xl font-semibold text-primary">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create and manage application users. Link a user to a Member for
          member self-service.
        </p>
      </header>

      {/* Create form */}
      <section className="border rounded-md p-6 space-y-3 shadow-sm bg-card">
        <h2 className="font-semibold text-primary">Create User</h2>
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
                  className={`px-3 py-2 cursor-pointer hover:bg-muted transition-colors ${
                    !memberId ? "bg-accent/20" : ""
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
                      className={`px-3 py-2 cursor-pointer hover:bg-muted transition-colors ${
                        memberId === m.id ? "bg-accent/20" : ""
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

        <div className="overflow-x-auto border rounded-md shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-sm">Username</th>
                <th className="text-left px-4 py-3 font-medium text-sm">Email</th>
                <th className="text-left px-4 py-3 font-medium text-sm">Role</th>
                <th className="text-left px-4 py-3 font-medium text-sm">Linked Member</th>
                <th className="text-left px-4 py-3 font-medium text-sm">Created</th>
                <th className="text-right px-4 py-3 font-medium text-sm w-36">Actions</th>
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
                  <tr key={u.id} className="border-t hover:bg-muted transition-colors">
                    <td className="p-2 font-medium">{u.username}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === "ADMIN" 
                          ? "bg-primary/20 text-primary" 
                          : "bg-accent/20 text-accent-foreground"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2">
                      {u.member
                        ? `${u.member.firstName} ${u.member.lastName}`
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeUser(u.id)}
                        className="hover:bg-destructive/90"
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
