"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBanner } from "@/components/providers/banner-provider";
import {
  Download,
  CreditCard,
  Users,
  Search,
  UserSearch,
  Sparkles,
  Zap,
  FileCheck,
  Settings,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

interface SearchMember {
  id: string;
  membershipId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  status: string;
  membershipLevel: string;
  memberCategory?: {
    code: string;
    name: string;
  } | null;
  passportPictureUrl: string | null;
  cardStats?: {
    hasCards: boolean;
    totalCards: number;
    totalGenerations: number;
    lastGenerated: string | null;
    latestCardStatus: string | null;
  };
}

interface MemberCategory {
  id: string;
  code: string;
  name: string;
}

export default function IdCardsPage() {
  const [memberCategories, setMemberCategories] = useState<MemberCategory[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMember[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { success, error: showError } = useBanner();

  // Bulk generation filters
  const [bulkFilters, setBulkFilters] = useState({
    status: "",
    membershipLevel: "",
    memberCategoryId: "",
  });

  useEffect(() => {
    loadMemberCategories();
  }, []);

  const loadMemberCategories = async () => {
    try {
      const response = await fetch("/api/member-categories");
      const data = await response.json();
      if (response.ok) {
        setMemberCategories(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load member categories:", error);
    }
  };

  const searchMembers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/members/search?q=${encodeURIComponent(
          query
        )}&limit=10&includeCardInfo=true`
      );
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.data || []);
      } else {
        showError("Search failed", data.error || "Unknown error occurred");
      }
    } catch {
      showError("Search failed", "Network error occurred");
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (memberSearchQuery) {
        searchMembers(memberSearchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [memberSearchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateSingleCard = async (memberId: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/member-id-cards/generate?memberId=${memberId}`
      );

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const contentDisposition = response.headers.get("content-disposition");
        const filename = contentDisposition
          ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
          : "ID_Card.pdf";

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        success(
          "ID card generated!",
          "The ID card has been generated and downloaded successfully."
        );
      } else {
        const errorData = await response.json();
        showError(
          "Failed to generate ID card",
          errorData.error || "Unknown error occurred"
        );
      }
    } catch {
      showError("Failed to generate ID card", "Network error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBulkCards = async () => {
    setIsGenerating(true);
    try {
      const requestBody: {
        format: string;
        includeBack: boolean;
        memberIds?: string[];
        filters?: {
          status: string;
          membershipLevel: string;
          memberCategoryId: string;
        };
      } = {
        format: "pdf",
        includeBack: true,
      };

      // Generate based on filters
      requestBody.filters = bulkFilters;

      const response = await fetch("/api/member-id-cards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // Trigger download of ZIP file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const contentDisposition = response.headers.get("content-disposition");
        const filename = contentDisposition
          ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
          : "Member_ID_Cards.zip";

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        success(
          "Bulk ID cards generated!",
          "All ID cards have been generated and downloaded successfully."
        );
        setShowBulkGenerator(false);
      } else {
        const errorData = await response.json();
        showError(
          "Failed to generate bulk ID cards",
          errorData.error || "Unknown error occurred"
        );
      }
    } catch {
      showError("Failed to generate bulk ID cards", "Network error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Header */}
        <div className="relative">
          <div className="relative bg-card border rounded-2xl p-8 shadow-elegant hover-lift">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary rounded-xl shadow-lg">
                    <CreditCard className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground">
                      ID Card Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Professional member identification system
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 ">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Instant Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    <span>Bulk Processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-accent" />
                    <span>High Quality PDF</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowMemberSearch(!showMemberSearch)}
                  variant={showMemberSearch ? "default" : "outline"}
                  className="group"
                  size="lg"
                >
                  <UserSearch className="w-5 h-5 mr-2" />
                  <span>Search Members</span>
                  {!showMemberSearch && (
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  )}
                </Button>
                <Button
                  onClick={() => setShowBulkGenerator(!showBulkGenerator)}
                  variant={showBulkGenerator ? "default" : "outline"}
                  className="group"
                  size="lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  <span>Bulk Generate</span>
                  {!showBulkGenerator && (
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-green hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Search & Generate
                  </p>
                  <p className="text-2xl font-bold text-accent mt-1">
                    Individual Cards
                  </p>
                </div>
                <div className="p-3 bg-secondary rounded-xl">
                  <UserSearch className="w-6 h-6 text-accent" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Find specific members and generate their ID cards instantly
              </p>
            </CardContent>
          </Card>

          <Card className="card-green hover-lift border-accent-purple">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Bulk Processing
                  </p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    Multiple Cards
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Generate cards for multiple members based on filters
              </p>
            </CardContent>
          </Card>

          <Card className="card-green hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    View Reports
                  </p>
                  <p className="text-2xl font-bold text-accent mt-1">
                    Analytics
                  </p>
                </div>
                <div className="p-3 bg-secondary rounded-xl">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                View detailed reports on ID card generation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Member Search */}
        {showMemberSearch && (
          <div className="relative animate-in slide-in-from-top-4 duration-500">
            <Card className="glass-effect shadow-elegant">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-lg shadow-lg">
                    <UserSearch className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      Search Members
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Find and generate ID cards for specific members
                    </CardDescription>
                  </div>
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMemberSearch(false)}
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, phone, or member ID..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="pl-12 pr-4 py-6 text-lg focus-ring-green"
                    />
                  </div>
                </div>

                {searchLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="relative">
                        <div className="w-16 h-16 bg-accent rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-elegant">
                          <Search className="w-8 h-8 text-accent-foreground animate-pulse" />
                        </div>
                      </div>
                      <p className="text-foreground font-medium">
                        Searching members...
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Please wait while we find matching members
                      </p>
                    </div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {searchResults.map((member, index) => (
                      <div
                        key={member.id}
                        className="group relative animate-in slide-in-from-left duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="card-green hover-lift rounded-xl p-4 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="relative">
                                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-lg">
                                  <UserSearch className="w-6 h-6 text-accent-foreground" />
                                </div>
                                {member.cardStats?.hasCards && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-3 h-3 text-accent-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground truncate">
                                    {member.firstName} {member.lastName}
                                  </h3>
                                  {member.cardStats?.hasCards && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs px-2 py-0.5"
                                    >
                                      {member.cardStats.latestCardStatus}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-1">
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                                    ID: {member.membershipId || "N/A"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                    {member.memberCategory?.name ||
                                      member.membershipLevel}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                                    {member.status}
                                  </span>
                                </div>
                                {member.cardStats?.hasCards && (
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <CreditCard className="w-3 h-3" />
                                      <span>
                                        {member.cardStats.totalCards} card(s)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />
                                      <span>
                                        {member.cardStats.totalGenerations}{" "}
                                        generation(s)
                                      </span>
                                    </div>
                                    {member.cardStats.lastGenerated && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                          Last:{" "}
                                          {new Date(
                                            member.cardStats.lastGenerated
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => generateSingleCard(member.id)}
                                disabled={isGenerating}
                                className="btn-primary"
                              >
                                {isGenerating ? (
                                  <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generating...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-2" />
                                    <span>
                                      {member.cardStats?.hasCards
                                        ? "Regenerate"
                                        : "Generate"}
                                    </span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {memberSearchQuery &&
                  !searchLoading &&
                  searchResults.length === 0 && (
                    <div className="text-center py-12">
                      <div className="relative">
                        <div className="w-20 h-20 bg-muted rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-elegant">
                          <UserSearch className="w-10 h-10 text-muted-foreground" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No members found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        No members match &quot;{memberSearchQuery}&quot;
                      </p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Try searching with:</p>
                        <div className="flex justify-center gap-2 flex-wrap">
                          <span className="px-2 py-1 bg-secondary rounded text-xs">
                            Full name
                          </span>
                          <span className="px-2 py-1 bg-secondary rounded text-xs">
                            Email address
                          </span>
                          <span className="px-2 py-1 bg-secondary rounded text-xs">
                            Phone number
                          </span>
                          <span className="px-2 py-1 bg-secondary rounded text-xs">
                            Member ID
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Bulk Generator */}
        {showBulkGenerator && (
          <div className="relative animate-in slide-in-from-top-4 duration-500">
            <Card className="glass-effect shadow-elegant">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg shadow-lg">
                    <Users className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      Bulk ID Card Generation
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Generate multiple ID cards efficiently with smart
                      filtering
                    </CardDescription>
                  </div>
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBulkGenerator(false)}
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Filter Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    <h3 className="text-lg font-medium text-foreground">
                      Filter Criteria
                    </h3>
                    <div className="flex-1 h-px bg-border ml-3"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        Member Status
                      </label>
                      <Select
                        value={bulkFilters.status || "__all_statuses__"}
                        onValueChange={(value) =>
                          setBulkFilters({
                            ...bulkFilters,
                            status: value === "__all_statuses__" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-12 focus-ring-green">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all_statuses__">
                            All statuses
                          </SelectItem>
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="PENDING">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="PROSPECT">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              Prospect
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Membership Level
                      </label>
                      <Select
                        value={bulkFilters.membershipLevel || "__all_levels__"}
                        onValueChange={(value) =>
                          setBulkFilters({
                            ...bulkFilters,
                            membershipLevel:
                              value === "__all_levels__" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-12 focus-ring-green">
                          <SelectValue placeholder="All levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all_levels__">
                            All levels
                          </SelectItem>
                          <SelectItem value="ORDINARY">Ordinary</SelectItem>
                          <SelectItem value="EXECUTIVE">Executive</SelectItem>
                          <SelectItem value="DELEGATE">Delegate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        Member Category
                      </label>
                      <Select
                        value={
                          bulkFilters.memberCategoryId || "__all_categories__"
                        }
                        onValueChange={(value) =>
                          setBulkFilters({
                            ...bulkFilters,
                            memberCategoryId:
                              value === "__all_categories__" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-12 focus-ring-green">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all_categories__">
                            All categories
                          </SelectItem>
                          {memberCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Filter Summary */}
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Current Filters
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bulkFilters.status && (
                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium border border-accent/20">
                          Status: {bulkFilters.status}
                        </span>
                      )}
                      {bulkFilters.membershipLevel && (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                          Level: {bulkFilters.membershipLevel}
                        </span>
                      )}
                      {bulkFilters.memberCategoryId && (
                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium border border-accent/20">
                          Category:{" "}
                          {
                            memberCategories.find(
                              (c) => c.id === bulkFilters.memberCategoryId
                            )?.name
                          }
                        </span>
                      )}
                      {!bulkFilters.status &&
                        !bulkFilters.membershipLevel &&
                        !bulkFilters.memberCategoryId && (
                          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                            All members will be included
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Cards will be generated as a downloadable ZIP file
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowBulkGenerator(false)}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={generateBulkCards}
                      disabled={isGenerating}
                      className="btn-primary px-6"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          <span>Generate Bulk Cards</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Professional Footer */}
        {!showMemberSearch && !showBulkGenerator && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-secondary rounded-xl border border-border hover-lift">
              <CreditCard className="w-5 h-5 text-accent" />
              <span className="text-sm text-muted-foreground">
                Need help? Visit the report Menu for detailed analytics
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
