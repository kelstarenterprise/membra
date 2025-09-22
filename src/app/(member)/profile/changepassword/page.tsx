"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type User = {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  memberId?: string | null;
  createdAt: string;
};

export default function ChangePasswordPage() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // form
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  // strength hint (very basic)
  const strength = useMemo(() => {
    let s = 0;
    if (newPw.length >= 8) s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[a-z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s; // 0..5
  }, [newPw]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) Try real auth-backed endpoint
      let user: User | null = null;
      try {
        const r = await fetch("/api/users/me");
        if (r.ok) {
          const j = await r.json();
          user = j.data as User;
        }
      } catch {
        /* ignore */
      }

      // 2) Fallback for local testing: ?userId=u_xxxxx
      if (!user) {
        const sp = new URLSearchParams(location.search);
        const id = sp.get("userId") ?? "";
        if (id) {
          // if you don’t have a direct user lookup, you can list and find:
          const r = await fetch("/api/users");
          if (r.ok) {
            const j = await r.json();
            user = (j.data as User[]).find((u) => u.id === id) ?? null;
          }
        }
      }

      setMe(user);
      setLoading(false);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!me) return;
    if (!newPw || newPw.length < 6) {
      setMsg({ type: "err", text: "Password must be at least 6 characters." });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ type: "err", text: "Passwords do not match." });
      return;
    }

    setSaving(true);
    const r = await fetch(`/api/users/${me.id}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPw }),
    });
    setSaving(false);

    if (r.ok) {
      setNewPw("");
      setConfirmPw("");
      setMsg({ type: "ok", text: "Password updated successfully." });
    } else {
      const j = await r.json().catch(() => ({} as string));
      setMsg({ type: "err", text: j.error || "Failed to update password." });
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Change Password</h1>
        <p className="text-sm text-muted-foreground">
          Set a new password for your account.
        </p>
      </header>

      {loading ? (
        <div className="p-6">Loading…</div>
      ) : !me ? (
        <div className="p-6 text-sm text-muted-foreground">
          We couldn’t detect your user session. If testing locally, append{" "}
          <code className="mx-1">?userId=u_admin</code> (or any valid id) to the
          URL.
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="space-y-4 max-w-md border rounded-md p-4"
        >
          <div className="text-sm text-muted-foreground">
            Logged in as <b>{me.username}</b> ({me.email})
          </div>

          {/* If your API verifies current password, add a field here and send it in body. */}

          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Enter a strong password"
            />
            <div className="mt-1 text-[11px] text-muted-foreground">
              Strength:{" "}
              <b>
                {
                  [
                    "Very weak",
                    "Weak",
                    "Fair",
                    "Good",
                    "Strong",
                    "Very strong",
                  ][strength]
                }
              </b>
              . Use 8+ chars with upper/lowercase, numbers & symbols.
            </div>
          </div>

          <div>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Re-enter new password"
            />
          </div>

          {msg && (
            <div
              className={`text-sm ${
                msg.type === "ok" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={saving || !newPw || !confirmPw}>
              {saving ? "Saving…" : "Update Password"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
