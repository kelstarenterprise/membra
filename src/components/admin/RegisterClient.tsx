"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const FormSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    username: z
      .string()
      .min(3, "Min 3 chars")
      .max(32, "Max 32 chars")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Only letters, numbers, dot, underscore, hyphen"
      ),
    password: z.string().min(6, "Min 6 characters"),
    confirm: z.string().min(6),
    memberId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof FormSchema>;

export default function RegisterClient({
  callbackUrl,
}: {
  callbackUrl: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState, watch } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirm: "",
      memberId: "",
    },
  });

  const pw = watch("password") || "";
  const strength = useMemo(() => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0..5
  }, [pw]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim(),
          username: values.username.trim(),
          password: values.password,
          memberId: values.memberId?.trim() || undefined,
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(j.error || "Registration failed");
        setSubmitting(false);
        return;
      }

      const res = await signIn("credentials", {
        redirect: false,
        usernameOrEmail: values.email || values.username,
        password: values.password,
        callbackUrl,
      });

      if (res?.error) {
        router.push(
          `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
      } else {
        router.push(res?.url || callbackUrl);
      }
    } catch (e) {
      console.error(e);
      alert("Registration failed");
      setSubmitting(false);
    }
  }

  // Strength labels
  const strengthLabel = [
    "Very weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Very strong",
  ][strength];

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left / Hero panel (hidden on small) */}
      <section className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500" />
        <div className="relative h-full w-full flex items-center justify-center p-12">
          <div className="max-w-md text-white">
            <h2 className="text-3xl font-bold leading-tight">
              Welcome to your membership hub
            </h2>
            <p className="mt-4 text-white/90">
              Register to manage dues, activities, and your membership
              profile—all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Right / Form panel */}
      <section className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 sm:p-8">
            <header className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Already have one?{" "}
                <a href="/auth/login" className="underline">
                  Sign in
                </a>
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {formState.errors.email && (
                  <p className="mt-1 text-xs text-rose-600" aria-live="polite">
                    {formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g., kwame"
                  {...register("username")}
                />
                {formState.errors.username && (
                  <p className="mt-1 text-xs text-rose-600" aria-live="polite">
                    {formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {/* Strength indicator */}
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={[
                          "h-1 w-full rounded",
                          strength > i ? "bg-green-500" : "bg-muted",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Strength: <b>{strengthLabel}</b>
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirm")}
                />
                {formState.errors.confirm && (
                  <p className="mt-1 text-xs text-rose-600" aria-live="polite">
                    {formState.errors.confirm.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="memberId">Member ID (optional)</Label>
                <Input
                  id="memberId"
                  placeholder="mxxxxxxxx"
                  {...register("memberId")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </div>

          {/* Small footer for mobile/medium */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our Terms & Privacy.
          </p>
        </div>
      </section>
    </main>
  );
}
