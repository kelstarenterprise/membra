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
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

/** Org-specific branding (edit these in one place) */
const ORG = {
  NAME: "Revolution For Prosperity",
  SHORT: "RFP",
  TAGLINE: "Moruo ke Bophelo",
  WEBSITE: "www.rfp.com",
  PHONE: "(+266) 7000 0000",
  PRIMARY: "primary", // Using our CSS variables
};

/** Utility to convert old indigo classes to our new green/purple theme */
function primary(cls: string) {
  return cls
    .replaceAll("indigo-50", "green-50")
    .replaceAll("indigo-100", "green-100")
    .replaceAll("indigo-200", "green-200")
    .replaceAll("indigo-600", "primary")
    .replaceAll("indigo-700", "primary/90")
    .replaceAll("indigo", "primary");
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
    role === "ADMIN" ? "/login" : role === "MEMBER" ? "/login" : "/login";

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-green-50/20">
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
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-green-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="size-8 rounded-lg bg-gradient-to-r from-primary to-accent shadow-md" />
          <div className="leading-tight">
            <span className="font-bold tracking-wide text-primary text-lg">
              {ORG.NAME}
            </span>
            <span className="text-[11px] text-accent block font-medium">
              {ORG.TAGLINE}
            </span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#about" className="text-muted-foreground hover:text-primary transition-colors">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {!isAuthed ? (
            <>
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all">
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
            <Link href={dashboardHref}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">Open Dashboard</Button>
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
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-green-200/30 blur-3xl" />
          <div className="absolute top-10 -right-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 font-medium" variant="secondary">
              {ORG.TAGLINE}
            </Badge>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight"
            >
              <span className="text-primary">
                Revolution
              </span>
              <span className="block text-accent">
                For Prosperity
              </span>
              <span className="block text-foreground/80 text-3xl sm:text-4xl mt-2">
                Member Portal
              </span>
            </motion.h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl font-medium">
              Official membership platform for RFP members. Manage your registration, dues, activities, and stay connected with the party.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 shadow-lg hover:shadow-xl transition-all">
                  Get Started Today
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 font-semibold px-8 py-3">
                  Member Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:justify-self-end"
          >
            <Card className="shadow-2xl border-green-200 bg-gradient-to-br from-white to-green-50/30">
              <CardHeader>
                <CardTitle className="text-xl text-primary font-bold">
                  Core Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Callout
                    icon={<Users className="size-5" />}
                    title="Member Management"
                    desc="Complete member profiles"
                  />
                  <Callout
                    icon={<CreditCard className="size-5" />}
                    title="Dues Collection"
                    desc="Automated payment tracking"
                  />
                  <Callout
                    icon={<Calendar className="size-5" />}
                    title="Event Management"
                    desc="Activities & notifications"
                  />
                  <Callout
                    icon={<ShieldCheck className="size-5" />}
                    title="Security First"
                    desc="Role-based access control"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 lg:py-24 border-t border-green-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
              Everything You Need
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Comprehensive tools designed for RFP party management and member services.
            </p>
          </div>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="size-6" />}
              title="Member Management"
              desc="Complete member profiles with registration, levels, and organizational hierarchy."
            />
            <FeatureCard
              icon={<CreditCard className="size-6" />}
              title="Financial Operations"
              desc="Automated dues assessment, payment tracking, and financial reporting."
            />
            <FeatureCard
              icon={<ShieldCheck className="size-6" />}
              title="Advanced Security"
              desc="Role-based access control with comprehensive audit trails and data protection."
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
            Join the {ORG.NAME} Movement
          </h3>
          <p className="mt-2 text-muted-foreground">
            Be part of building a prosperous future for Lesotho. Register as an {ORG.SHORT} member today.
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
              q="Is this the official RFP portal?"
              a={`Yes. This is the official membership system for ${ORG.NAME}. Visit ${ORG.WEBSITE} for more information.`}
            />
            <Faq
              q="How do I pay my membership dues?"
              a="You can pay online through supported payment methods or record manual payments approved by your constituency coordinator."
            />
            <Faq
              q="How is my personal data protected?"
              a="We use enterprise-grade security with role-based access controls, secure authentication, and comprehensive audit logs to protect all member information."
            />
            <Faq
              q="Need help or support?"
              a={`Contact our member support team at ${ORG.PHONE} or through your local constituency office for assistance.`}
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
    <footer className="border-t bg-gradient-to-r from-green-50/30 to-green-100/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-primary mb-2">{ORG.NAME}</h4>
            <p className="text-sm text-muted-foreground">{ORG.TAGLINE}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Contact</h4>
            <p className="text-sm text-muted-foreground">Phone: {ORG.PHONE}</p>
            <p className="text-sm text-muted-foreground">Web: {ORG.WEBSITE}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Quick Links</h4>
            <div className="flex flex-col gap-1">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                Features
              </Link>
              <Link href="#faq" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                FAQ
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-green-200">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {ORG.NAME} • All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
