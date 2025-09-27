"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useBanner } from "@/components/providers/banner-provider";
import { Download, CreditCard, Users, Search, Plus } from "lucide-react";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  membershipId: string | null;
  status: string;
}

interface MemberIdCard {
  id: string;
  cardNumber: string;
  issuedAt: string | null;
  expiresAt: string | null;
  status: "PENDING" | "PRINTED" | "ISSUED" | "REVOKED" | "EXPIRED";
  member: Member;
}

interface MemberCategory {
  id: string;
  code: string;
  name: string;
}

export default function IdCardsPage() {
  const [cards, setCards] = useState<MemberIdCard[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberCategories, setMemberCategories] = useState<MemberCategory[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  
  const { success, error: showError } = useBanner();

  // Bulk generation filters
  const [bulkFilters, setBulkFilters] = useState({
    status: "",
    membershipLevel: "",
    memberCategoryId: "",
  });

  useEffect(() => {
    loadCards();
    loadMembers();
    loadMemberCategories();
  }, [searchQuery, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCards = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/member-id-cards?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setCards(data.data || []);
      } else {
        showError("Failed to load ID cards", data.error || "Unknown error occurred");
      }
    } catch {
      showError("Failed to load ID cards", "Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await fetch("/api/members");
      const data = await response.json();
      if (response.ok) {
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load members:", error);
    }
  };

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

  const generateSingleCard = async (memberId: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/member-id-cards/generate?memberId=${memberId}`);
      
      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : 'ID_Card.pdf';
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        success("ID card generated!", "The ID card has been generated and downloaded successfully.");
        loadCards(); // Refresh the cards list
      } else {
        const errorData = await response.json();
        showError("Failed to generate ID card", errorData.error || "Unknown error occurred");
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

      if (selectedCards.length > 0) {
        // Generate for selected cards' members
        const selectedMemberIds = cards
          .filter(card => selectedCards.includes(card.id))
          .map(card => card.member.id);
        requestBody.memberIds = selectedMemberIds;
      } else {
        // Generate based on filters
        requestBody.filters = bulkFilters;
      }

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
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : 'Member_ID_Cards.zip';
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        success("Bulk ID cards generated!", "All selected ID cards have been generated and downloaded successfully.");
        loadCards(); // Refresh the cards list
        setSelectedCards([]);
        setShowBulkGenerator(false);
      } else {
        const errorData = await response.json();
        showError("Failed to generate bulk ID cards", errorData.error || "Unknown error occurred");
      }
    } catch {
      showError("Failed to generate bulk ID cards", "Network error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "PRINTED": return "bg-blue-100 text-blue-800";
      case "ISSUED": return "bg-green-100 text-green-800";
      case "REVOKED": return "bg-red-100 text-red-800";
      case "EXPIRED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleCardSelection = (cardId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCards([...selectedCards, cardId]);
    } else {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    }
  };

  const selectAllCards = () => {
    if (selectedCards.length === cards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(cards.map(card => card.id));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Loading ID cards...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ID Card Management</h1>
          <p className="text-muted-foreground">
            Generate, manage, and track member ID cards
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowBulkGenerator(!showBulkGenerator)}
            variant="outline"
          >
            <Users className="w-4 h-4 mr-2" />
            Bulk Generate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cards.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
            <Badge className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cards.filter(card => card.status === "ISSUED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Printed</CardTitle>
            <Badge className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {cards.filter(card => card.status === "PRINTED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {cards.filter(card => card.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Generator */}
      {showBulkGenerator && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk ID Card Generation</CardTitle>
            <CardDescription>
              Generate ID cards for multiple members at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Member Status</label>
                <Select
                  value={bulkFilters.status || "__all_statuses__"}
                  onValueChange={(value) => setBulkFilters({...bulkFilters, status: value === "__all_statuses__" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all_statuses__">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Membership Level</label>
                <Select
                  value={bulkFilters.membershipLevel || "__all_levels__"}
                  onValueChange={(value) => setBulkFilters({...bulkFilters, membershipLevel: value === "__all_levels__" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all_levels__">All levels</SelectItem>
                    <SelectItem value="ORDINARY">Ordinary</SelectItem>
                    <SelectItem value="EXECUTIVE">Executive</SelectItem>
                    <SelectItem value="DELEGATE">Delegate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Member Category</label>
                <Select
                  value={bulkFilters.memberCategoryId || "__all_categories__"}
                  onValueChange={(value) => setBulkFilters({...bulkFilters, memberCategoryId: value === "__all_categories__" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all_categories__">All categories</SelectItem>
                    {memberCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBulkGenerator(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={generateBulkCards}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Bulk Cards"}
                <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by card number or member name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter || "__all_statuses__"} onValueChange={(value) => setStatusFilter(value === "__all_statuses__" ? "" : value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all_statuses__">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PRINTED">Printed</SelectItem>
                <SelectItem value="ISSUED">Issued</SelectItem>
                <SelectItem value="REVOKED">Revoked</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectedCards.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCards.length === cards.length}
                  onChange={selectAllCards}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedCards.length} of {cards.length} cards selected
                </span>
              </div>
              <Button
                onClick={generateBulkCards}
                disabled={isGenerating}
                size="sm"
              >
                {isGenerating ? "Generating..." : "Generate Selected"}
                <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards List */}
      <Card>
        <CardHeader>
          <CardTitle>ID Cards</CardTitle>
          <CardDescription>
            Manage and track all member ID cards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No ID cards found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by generating ID cards for your members.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedCards.includes(card.id)}
                      onChange={(e) => handleCardSelection(card.id, e.target.checked)}
                    />
                    <div>
                      <div className="font-medium">
                        {card.member.firstName} {card.member.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Card: {card.cardNumber} • Member ID: {card.member.membershipId || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(card.status)}>
                      {card.status}
                    </Badge>
                    <div className="text-right text-sm text-muted-foreground">
                      {card.issuedAt ? (
                        <>
                          Issued: {new Date(card.issuedAt).toLocaleDateString()}
                          {card.expiresAt && (
                            <div>Expires: {new Date(card.expiresAt).toLocaleDateString()}</div>
                          )}
                        </>
                      ) : (
                        'Not issued'
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => generateSingleCard(card.member.id)}
                      disabled={isGenerating}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members without cards */}
      <Card>
        <CardHeader>
          <CardTitle>Members without ID Cards</CardTitle>
          <CardDescription>
            Generate ID cards for these members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const membersWithCards = new Set(cards.map(card => card.member.id));
            const membersWithoutCards = members.filter(member => !membersWithCards.has(member.id));
            
            if (membersWithoutCards.length === 0) {
              return (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    All members have ID cards
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {membersWithoutCards.slice(0, 10).map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Member ID: {member.membershipId || 'N/A'} • Status: {member.status}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => generateSingleCard(member.id)}
                      disabled={isGenerating}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Card
                    </Button>
                  </div>
                ))}
                {membersWithoutCards.length > 10 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      ... and {membersWithoutCards.length - 10} more members
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}