"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import Link from "next/link";

function LoginForm() {
  const [id, setId] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const sp = useSearchParams();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      usernameOrEmail: id, // match authorize() in your Credentials provider
      password,
      callbackUrl: sp.get("callbackUrl") || "/dashboard",
    });

    setLoading(false);

    if (!res) return;
    if (res.error) {
      setError("Invalid login credentials");
      return;
    }

    router.push(res.url || "/dashboard");
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left / Hero panel (large screens) */}
      <section className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500" />
        <div className="relative h-full w-full flex items-center justify-center p-12">
          <div className="max-w-md text-white">
            <h2 className="text-3xl font-bold leading-tight">
              Welcome to MEMBRA
            </h2>
            <p className="mt-4 text-white/90">Sign in or Create and Account</p>
          </div>
        </div>
      </section>

      {/* Right / Form panel */}
      <section className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-semibold">
                Sign in
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-6">
                <FormField
                  label="Email or Username"
                  required
                  id="login-id"
                >
                  <Input
                    id="login-id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="you@example.com or username"
                    autoFocus
                  />
                </FormField>
                
                <FormField
                  label="Password"
                  required
                  id="login-password"
                >
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </FormField>

                {error && (
                  <p className="text-sm text-rose-600" aria-live="polite">
                    {error}
                  </p>
                )}

                <Button
                  className="w-full"
                  disabled={loading || !id || !password}
                  type="submit"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </Button>

                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>
                    <Link
                      className="underline underline-offset-4"
                      href="/forgot-password"
                    >
                      Forgot password?
                    </Link>
                  </p>
                  <p>
                    Don’t have an account?{" "}
                    <Link
                      className="underline underline-offset-4"
                      href={
                        sp.get("callbackUrl")
                          ? `/register?callbackUrl=${encodeURIComponent(
                              sp.get("callbackUrl") as string
                            )}`
                          : "register"
                      }
                    >
                      Create one
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms & Privacy.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
