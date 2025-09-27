"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBanner } from "@/components/providers/banner-provider";
import { Download, CreditCard, Calendar, Shield } from "lucide-react";

type Member = {
  // Auto-generated fields
  id: string;
  membershipId?: string;
  createdAt: string; // ISO
  
  // Required personal information
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  phone?: string;
  residentialAddress?: string;
  regionConstituencyElectoralArea?: string;
  
  // Optional personal information
  email?: string;
  occupation?: string;
  highestEducationLevel?: string;
  
  // Membership details
  membershipLevel?: string;
  branchWard?: string;
  recruitedBy?: string;
  
  // System fields
  level?: string | null;
  status: "PROSPECT" | "PENDING" | "ACTIVE" | "SUSPENDED";
  outstandingBalance?: number;
  
  // Attachments
  passportPictureUrl?: string | null;
  
  // Legacy fields
  nationality?: string;
};

interface MemberIdCard {
  id: string;
  cardNumber: string;
  issuedAt: string | null;
  expiresAt: string | null;
  status: "PENDING" | "PRINTED" | "ISSUED" | "REVOKED" | "EXPIRED";
}

export default function MemberProfilePage() {
  const [member, setMember] = useState<Member | null>(null);
  const [idCards, setIdCards] = useState<MemberIdCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  
  const { success, error: showError } = useBanner();

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) Try real auth-backed endpoint
      let me: Member | null = null;
      try {
        const r = await fetch("/api/members/me");
        if (r.ok) {
          const j = await r.json();
          me = j.data as Member;
        }
      } catch {
        /* ignore */
      }

      // 2) Fallback for local testing: ?memberId=...
      if (!me) {
        const sp = new URLSearchParams(location.search);
        const id = sp.get("memberId") ?? "";
        if (id) {
          const r = await fetch(`/api/members?q=${encodeURIComponent(id)}`);
          const j = await r.json();
          me =
            (j.data as Member[]).find((m) => m.id === id) ??
            (j.data as Member[])[0] ??
            null;
        }
      }

      setMember(me);
      setLoading(false);
      
      // Load ID cards for the member
      if (me?.id) {
        loadIdCards(me.id);
      }
    })();
  }, []);
  
  const loadIdCards = async (memberId: string) => {
    setLoadingCards(true);
    try {
      const response = await fetch(`/api/member-id-cards?memberId=${memberId}`);
      const data = await response.json();
      
      if (response.ok) {
        setIdCards(data.data || []);
      } else {
        console.error("Failed to load ID cards:", data.error);
      }
    } catch (error) {
      console.error("Failed to load ID cards:", error);
    } finally {
      setLoadingCards(false);
    }
  };
  
  const generateIdCard = async () => {
    if (!member?.id) return;
    
    setGeneratingCard(true);
    try {
      const response = await fetch(`/api/member-id-cards/generate?memberId=${member.id}`);
      
      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : 'My_ID_Card.pdf';
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        success("ID card generated!", "Your ID card has been generated and downloaded successfully.");
        
        // Refresh ID cards list
        loadIdCards(member.id);
      } else {
        const errorData = await response.json();
        showError("Failed to generate ID card", errorData.error || "Please contact support for assistance.");
      }
    } catch {
      showError("Failed to generate ID card", "Network error occurred. Please try again.");
    } finally {
      setGeneratingCard(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!member) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        We couldn’t detect your account. If you’re testing locally, append{" "}
        <code className="mx-1">?memberId=m1</code> to the URL.
      </div>
    );
  }

  const fullName = `${member.firstName} ${member.lastName}`;
  const joined = new Date(member.createdAt).toLocaleDateString();
  const outstanding = (member.outstandingBalance ?? 0).toFixed(2);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            View your personal details and membership info.
          </p>
        </div>

        {/* Optional future action */}
        {/* <Button asChild><Link href="/member/profile/edit">Edit Profile</Link></Button> */}
      </header>

      {/* Top card: avatar + name + status */}
      <section className="border rounded-xl p-5 flex flex-col md:flex-row gap-5">
        <div className="shrink-0">
          <Avatar
            src={member.passportPictureUrl || ""}
            name={fullName}
            size={96}
          />
        </div>
        <div className="min-w-0 grow">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-lg font-semibold truncate">{fullName}</h2>
            <StatusPill status={member.status} />
          </div>
          <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
            {member.membershipLevel ? (
              <span>
                Membership: <b>{member.membershipLevel}</b>
              </span>
            ) : null}
            {member.level ? (
              <span>
                Category: <b>{member.level}</b>
              </span>
            ) : null}
            <span>
              Member ID: <b>{member.membershipId || member.id}</b>
            </span>
            <span>
              Joined: <b>{joined}</b>
            </span>
          </div>
        </div>
        <div className="md:ml-auto flex items-start">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Outstanding Balance
            </div>
            <div className="text-2xl font-semibold">GHS {outstanding}</div>
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section className="border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Field label="Date of Birth" value={member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : "-"} />
          <Field label="Gender" value={member.gender ? member.gender.charAt(0) + member.gender.slice(1).toLowerCase() : "-"} />
          <Field label="National ID / Voter ID" value={member.nationalId || "-"} />
          <Field label="Phone Number" value={member.phone || "-"} />
          <Field label="Email Address" value={member.email || "-"} />
          <Field label="Nationality" value={member.nationality || "-"} />
        </div>
      </section>

      {/* Address Information */}
      <section className="border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Address & Location</h3>
        <div className="grid grid-cols-1 gap-4 text-sm">
          <Field
            label="Residential Address"
            value={member.residentialAddress || "-"}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Region / Constituency / Electoral Area"
              value={member.regionConstituencyElectoralArea || "-"}
            />
            <Field label="Branch / Ward" value={member.branchWard || "-"} />
          </div>
        </div>
      </section>

      {/* Professional & Education */}
      <section className="border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Professional & Educational Background</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Occupation" value={member.occupation || "-"} />
          <Field 
            label="Highest Education Level" 
            value={member.highestEducationLevel ? 
              member.highestEducationLevel.charAt(0) + member.highestEducationLevel.slice(1).toLowerCase() : "-"} 
          />
        </div>
      </section>

      {/* Membership Details */}
      <section className="border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Membership Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Field 
            label="Membership Level" 
            value={member.membershipLevel ? 
              member.membershipLevel.charAt(0) + member.membershipLevel.slice(1).toLowerCase() : "-"} 
          />
          <Field 
            label="Member Category" 
            value={member.level ? 
              member.level.charAt(0) + member.level.slice(1).toLowerCase() : "-"} 
          />
          <Field 
            label="Status" 
            value={member.status.charAt(0) + member.status.slice(1).toLowerCase()} 
          />
          <Field label="Date of Registration" value={joined} />
          <Field label="Recruited By" value={member.recruitedBy || "-"} />
          <Field label="Outstanding Balance" value={`GHS ${outstanding}`} />
        </div>
      </section>

      {/* ID Card Section */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle>My ID Card</CardTitle>
              </div>
              {!loadingCards && (
                <Button
                  onClick={generateIdCard}
                  disabled={generatingCard}
                  size="sm"
                >
                  {generatingCard ? "Generating..." : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {idCards.length > 0 ? "Download Card" : "Generate Card"}
                    </>
                  )}
                </Button>
              )}
            </div>
            <CardDescription>
              {idCards.length > 0 
                ? "Download or view your current ID card" 
                : "Generate your digital membership ID card"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCards ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <CreditCard className="mx-auto h-8 w-8 animate-pulse mb-2" />
                  <p>Loading ID cards...</p>
                </div>
              </div>
            ) : idCards.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h4 className="font-medium text-foreground mb-2">No ID Card Yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate your digital membership ID card to access member benefits and verify your membership status.
                  </p>
                  <Button onClick={generateIdCard} disabled={generatingCard}>
                    {generatingCard ? "Generating..." : "Generate My ID Card"}
                    <CreditCard className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {idCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">ID Card #{card.cardNumber}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {card.issuedAt ? (
                              `Issued: ${new Date(card.issuedAt).toLocaleDateString()}`
                            ) : (
                              'Not issued'
                            )}
                          </span>
                          {card.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Expires: {new Date(card.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={getCardStatusVariant(card.status)}
                        className={getCardStatusColor(card.status)}
                      >
                        {card.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={generateIdCard}
                        disabled={generatingCard}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* ID Card Features */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    ID Card Features
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Digital verification via QR code</li>
                    <li>• Member photo and personal information</li>
                    <li>• Membership level and category</li>
                    <li>• Secure card number and expiry date</li>
                    <li>• Print-ready PDF format</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick actions (optional) */}
      <section className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => window.open("/member/my-statement", "_self")}
        >
          View My Statement
        </Button>
        {/* Add more actions like "Update Photo" or "Change Password" here later */}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: Member["status"] }) {
  const color =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : status === "PENDING"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : status === "SUSPENDED"
      ? "bg-rose-100 text-rose-800 border-rose-200"
      : "bg-slate-100 text-slate-700 border-slate-200"; // PROSPECT
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${color}`}
    >
      {status}
    </span>
  );
}

function getCardStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ISSUED": return "default";
    case "PRINTED": return "secondary";
    case "PENDING": return "outline";
    case "REVOKED":
    case "EXPIRED": return "destructive";
    default: return "outline";
  }
}

function getCardStatusColor(status: string): string {
  switch (status) {
    case "PENDING": return "text-yellow-700 border-yellow-300 bg-yellow-50";
    case "PRINTED": return "text-blue-700 border-blue-300 bg-blue-50";
    case "ISSUED": return "text-green-700 border-green-300 bg-green-50";
    case "REVOKED": return "text-red-700 border-red-300 bg-red-50";
    case "EXPIRED": return "text-gray-700 border-gray-300 bg-gray-50";
    default: return "text-gray-700 border-gray-300 bg-gray-50";
  }
}

function Avatar({
  src,
  name,
  size = 80,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  if (src) {
    return (
      <div
        className="relative rounded-xl overflow-hidden border"
        style={{ width: size, height: size }}
      >
        {/* Using next/image for optimization; falls back to plain img if needed */}
        <Image
          src={src}
          alt={`${name} photo`}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border bg-muted flex items-center justify-center font-semibold"
      style={{ width: size, height: size }}
      aria-label={`${name} avatar placeholder`}
    >
      {initials || "?"}
    </div>
  );
}
