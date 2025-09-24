"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CreditCard,
  Calendar,
  IdCard,
  Bell,
  ShieldCheck,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

/** Org-specific branding (edit these in one place) */
const ORG = {
  NAME: "Unity Party",
  SHORT: "UP",
  TAGLINE: "Service • Integrity • Progress",
  PRIMARY: "indigo", // Tailwind color family used throughout
};

/** Utility to swap primary color classes */
function primary(cls: string) {
  // Replace "indigo" occurrences with the chosen primary color
  return cls.replaceAll("indigo", ORG.PRIMARY);
}

/**
 * Organization-specific landing page for the official member portal
 */
export default function Home() {
  const { data: session, status } = useSession();

  type UserWithRole = { role?: "ADMIN" | "MEMBER" };
  const role = (session?.user && (session.user as UserWithRole).role) as
    | "ADMIN"
    | "MEMBER"
    | undefined;

  const dashboardHref =
    role === "ADMIN"
      ? "/dashboard"
      : role === "MEMBER"
      ? "/dashboard"
      : "/dashboard";

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div
      className={primary(
        "min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white"
      )}
    >
      <SiteNav isAuthed={!!session} dashboardHref={dashboardHref} />

      {!session ? (
        <PublicLanding />
      ) : (
        <AuthedWelcome
          userLabel={
            (session.user?.name ?? session.user?.email ?? "Member") as string
          }
          dashboardHref={dashboardHref}
          role={role}
        />
      )}

      <SiteFooter />
    </div>
  );
}

/*** NAVBAR ***/
function SiteNav({
  isAuthed,
  dashboardHref,
}: {
  isAuthed: boolean;
  dashboardHref: string;
}) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* Placeholder for org mark */}
          <div className={primary("size-7 rounded-lg bg-indigo-600")} />
          <div className="leading-tight">
            <span className="font-semibold tracking-tight block">
              {ORG.NAME}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Official Member Portal
            </span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="#faq" className="hover:text-foreground">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {!isAuthed ? (
            <>
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button
                  className={primary("bg-indigo-600 hover:bg-indigo-700")}
                >
                  Join {ORG.SHORT}
                </Button>
              </Link>
            </>
          ) : (
            <Link href={dashboardHref}>
              <Button>Open Dashboard</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/*** PUBLIC LANDING ***/
function PublicLanding() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div
            className={primary(
              "absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl"
            )}
          />
          <div
            className={primary(
              "absolute top-10 -right-20 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl"
            )}
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="mb-4" variant="secondary">
              {ORG.NAME} — {ORG.TAGLINE}
            </Badge>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-5xl font-extrabold tracking-tight"
            >
              A modern platform for {ORG.SHORT} membership.
              <span className={primary("block text-indigo-600")}>
                Unifying members, dues & activities nationwide.
              </span>
            </motion.h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
              Join {ORG.SHORT}, update your details, pay dues securely, and stay
              informed about national and branch activities—all in one place.
            </p>

            <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4" /> Verified Party Membership
              </div>
              <div className="flex items-center gap-2">
                <Bell className="size-4" /> Email & SMS notices
              </div>
            </div>
          </div>

          {/* Hero Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:justify-self-end"
          >
            <Card className="shadow-2xl border-emerald-100">
              <CardHeader>
                <CardTitle className="text-lg">
                  {ORG.SHORT} Member Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Callout
                    icon={<Users className="size-4" />}
                    title="Member Registry"
                    desc="Full profile, branches/wards, levels"
                  />
                  <Callout
                    icon={<CreditCard className="size-4" />}
                    title="Dues & Levies"
                    desc="Pay by MoMo/bank receipt, auto statements"
                  />
                  <Callout
                    icon={<Calendar className="size-4" />}
                    title="Activities"
                    desc="National & branch events, RSVP"
                  />
                  <Callout
                    icon={<IdCard className="size-4" />}
                    title="Digital ID"
                    desc="Printable & scannable party ID"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-16 lg:py-20 border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Built for {ORG.SHORT} administration
            </h2>
            <p className="mt-2 text-muted-foreground">
              Purpose‑built workflows for national, regional and constituency
              executives, and a clean portal for members.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Users className="size-5" />}
              title="Membership"
              desc="Register, import CSV, assign levels, capture photos/biometrics."
            />
            <FeatureCard
              icon={<CreditCard className="size-5" />}
              title="Finance"
              desc="Assess dues by level, record payments, generate statements."
            />
            <FeatureCard
              icon={<Calendar className="size-5" />}
              title="Activities"
              desc="Publish events, push notices via email/SMS, attendance logs."
            />
            <FeatureCard
              icon={<IdCard className="size-5" />}
              title="IDs"
              desc="Generate printable member ID cards with QR verification."
            />
            <FeatureCard
              icon={<ShieldCheck className="size-5" />}
              title="Security"
              desc="RBAC for National → Polling Station roles, audit trails."
            />
            <FeatureCard
              icon={<MapPin className="size-5" />}
              title="Branches & Wards"
              desc="Organize members by region, constituency, electoral area."
            />
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section
        className={primary(
          "py-16 lg:py-20 border-t bg-gradient-to-br from-indigo-50 to-white"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Be part of {ORG.NAME}&rsquo;s progress
          </h3>
          <p className="mt-2 text-muted-foreground">
            Join thousands of members building a stronger {ORG.SHORT}. It takes
            minutes to get started.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className={primary("bg-indigo-600 hover:bg-indigo-700")}
              >
                Join {ORG.SHORT}
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-14 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h4 className="text-xl sm:text-2xl font-semibold">
            Frequently asked
          </h4>
          <div className="mt-6 grid md:grid-cols-2 gap-6 text-sm">
            <Faq
              q="Is this the official portal?"
              a={`Yes. This is the official membership system for ${ORG.NAME}.`}
            />
            <Faq
              q="How do I pay my dues?"
              a="You can pay online (if enabled) or record manual payments approved by your branch treasurer."
            />
            <Faq
              q="How is my data protected?"
              a="We use role‑based access, secure authentication (NextAuth), and audit logs."
            />
            <Faq
              q="Can I change my branch/ward?"
              a="Yes—submit a transfer request from your profile; branch admins will review it."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/*** AUTHED WELCOME ***/
function AuthedWelcome({
  userLabel,
  dashboardHref,
  role,
}: {
  userLabel: string;
  dashboardHref: string;
  role?: "ADMIN" | "MEMBER";
}) {
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl py-16 lg:py-24">
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome back to {ORG.SHORT}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Signed in as <b>{userLabel}</b>
            </p>
            <Link href={dashboardHref}>
              <Button className="w-full sm:w-auto">
                Open {role === "ADMIN" ? "Executive" : "Member"} Dashboard
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Not you?{" "}
              <Link className="text-indigo-700 hover:underline" href="/login">
                Switch account
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

/*** REUSABLES ***/
function Callout({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2 font-medium text-foreground">
        <span className={primary("text-indigo-600")}>{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 hover:shadow-md transition-shadow">
      <div className={primary("flex items-center gap-2 text-indigo-600")}>
        {icon}
        <span className="font-semibold text-foreground">{title}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({
  index,
  title,
  desc,
}: {
  index: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div
        className={primary(
          "size-8 rounded-full grid place-items-center bg-indigo-600 text-white font-semibold"
        )}
      >
        {index}
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="font-medium">{q}</div>
      <p className="mt-1 text-muted-foreground">{a}</p>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} {ORG.NAME} • {ORG.TAGLINE}
        </p>
        <div className="flex items-center gap-4">
          <Link href="#features" className="hover:underline">
            Features
          </Link>

          <Link href="#faq" className="hover:underline">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}
