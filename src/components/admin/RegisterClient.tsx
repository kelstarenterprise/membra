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
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      } else {
        router.push(res?.url || callbackUrl);
      }
    } catch (e) {
      console.error(e);
      alert("Registration failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md mt-10 border rounded-lg p-6 space-y-5 bg-white">
      <header>
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Already have one?{" "}
          <a href="/auth/login" className="underline">
            Sign in
          </a>
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {formState.errors.email && (
            <p className="text-xs text-rose-600">
              {formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label>Username</Label>
          <Input placeholder="e.g., kwame" {...register("username")} />
          {formState.errors.username && (
            <p className="text-xs text-rose-600">
              {formState.errors.username.message}
            </p>
          )}
        </div>

        <div>
          <Label>Password</Label>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Strength:{" "}
            <b>
              {
                ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"][
                  strength
                ]
              }
            </b>
          </p>
        </div>

        <div>
          <Label>Confirm Password</Label>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
          />
          {formState.errors.confirm && (
            <p className="text-xs text-rose-600">
              {formState.errors.confirm.message}
            </p>
          )}
        </div>

        <div>
          <Label>Member ID (optional)</Label>
          <Input placeholder="mxxxxxxxx" {...register("memberId")} />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
