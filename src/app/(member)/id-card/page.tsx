"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBanner } from "@/components/providers/banner-provider";
import { Download, CreditCard, Calendar, Shield, User, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  membershipId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  membershipLevel?: string;
  status: "PROSPECT" | "PENDING" | "ACTIVE" | "SUSPENDED";
  passportPictureUrl?: string | null;
  createdAt: string;
}

interface MemberIdCard {
  id: string;
  cardNumber: string;
  issuedAt: string | null;
  expiresAt: string | null;
  status: "PENDING" | "PRINTED" | "ISSUED" | "REVOKED" | "EXPIRED";
}

export default function MemberIdCardPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [idCards, setIdCards] = useState<MemberIdCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  
  const { success, error: showError } = useBanner();

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Try real auth-backed endpoint
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

      // Fallback for local testing: ?memberId=...
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

  const getCardStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "ISSUED": return "default";
      case "PRINTED": return "secondary";
      case "PENDING": return "outline";
      case "REVOKED":
      case "EXPIRED": return "destructive";
      default: return "outline";
    }
  };

  const getCardStatusColor = (status: string): string => {
    switch (status) {
      case "PENDING": return "text-yellow-700 border-yellow-300 bg-yellow-50";
      case "PRINTED": return "text-blue-700 border-blue-300 bg-blue-50";
      case "ISSUED": return "text-green-700 border-green-300 bg-green-50";
      case "REVOKED": return "text-red-700 border-red-300 bg-red-50";
      case "EXPIRED": return "text-gray-700 border-gray-300 bg-gray-50";
      default: return "text-gray-700 border-gray-300 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Loading...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Not Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We couldn&apos;t detect your account. Please make sure you&apos;re logged in.
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            My ID Card
          </h1>
          <p className="text-muted-foreground">
            Generate and download your digital membership ID card
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/profile">
              <User className="w-4 h-4 mr-2" />
              View Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Member Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {member.firstName} {member.lastName}
              </h3>
              <div className="text-sm text-muted-foreground flex items-center gap-4">
                <span>Member ID: <strong>{member.membershipId || member.id}</strong></span>
                <span>Level: <strong>{member.membershipLevel || 'N/A'}</strong></span>
                <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {member.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ID Card Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Digital ID Card
            </CardTitle>
            {!loadingCards && (
              <Button
                onClick={generateIdCard}
                disabled={generatingCard}
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
            Your official digital membership ID card with QR verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCards ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <CreditCard className="mx-auto h-8 w-8 animate-pulse mb-2" />
                <p>Loading ID cards...</p>
              </div>
            </div>
          ) : idCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <CreditCard className="w-12 h-12 text-white" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Ready to Generate Your ID Card?</h4>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your official digital membership ID card. It includes your photo, membership details, and a secure QR code for verification.
              </p>
              <Button onClick={generateIdCard} disabled={generatingCard} size="lg">
                {generatingCard ? "Generating..." : "Generate My ID Card"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {idCards.map((card) => (
                <div key={card.id} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-md">
                        <CreditCard className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">ID Card #{card.cardNumber}</h4>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
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
                        variant="outline"
                        onClick={generateIdCard}
                        disabled={generatingCard}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Card Preview */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="text-xs font-medium opacity-80">REVOLUTION FOR PROSPERITY</h5>
                        <h6 className="text-xs opacity-60">Moruo ke Bophelo</h6>
                      </div>
                      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">{member.firstName} {member.lastName}</p>
                      <p className="text-xs opacity-80">ID: {member.membershipId || member.id}</p>
                      <p className="text-xs opacity-80">Level: {member.membershipLevel || 'Member'}</p>
                    </div>
                    <div className="mt-3 flex justify-between items-end">
                      <div className="text-xs opacity-60">
                        Card #: {card.cardNumber}
                      </div>
                      {card.expiresAt && (
                        <div className="text-xs opacity-60">
                          Expires: {new Date(card.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Features Section */}
              <div className="bg-muted/50 rounded-lg p-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  ID Card Features
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Security Features</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Secure QR code verification</li>
                      <li>• Unique card number and security code</li>
                      <li>• Tamper-evident design elements</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Card Information</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Member photo and personal details</li>
                      <li>• Membership level and category</li>
                      <li>• Contact information and validity period</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <User className="w-8 h-8 text-primary mx-auto mb-2" />
              <h5 className="font-medium mb-1">Update Profile</h5>
              <p className="text-xs text-muted-foreground mb-3">Keep your information current</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile">View Profile</Link>
              </Button>
            </div>
            <div className="text-center p-4">
              <Download className="w-8 h-8 text-primary mx-auto mb-2" />
              <h5 className="font-medium mb-1">Print Quality</h5>
              <p className="text-xs text-muted-foreground mb-3">Cards are print-ready at 300 DPI</p>
              <Button variant="outline" size="sm" disabled>
                Learn More
              </Button>
            </div>
            <div className="text-center p-4">
              <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
              <h5 className="font-medium mb-1">Lost Card?</h5>
              <p className="text-xs text-muted-foreground mb-3">Report and regenerate anytime</p>
              <Button variant="outline" size="sm" disabled>
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}