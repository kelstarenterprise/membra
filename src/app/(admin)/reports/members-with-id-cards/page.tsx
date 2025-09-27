"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useBanner } from "@/components/providers/banner-provider";
import { Download, CreditCard, Search, FileText, RefreshCw, Clock, Hash, Calendar } from "lucide-react";

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
    id: string;
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

export default function MembersWithIdCardsReport() {
  const [members, setMembers] = useState<SearchMember[]>([]);
  const [memberCategories, setMemberCategories] = useState<MemberCategory[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<SearchMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cardStatusFilter, setCardStatusFilter] = useState("");
  const [generationsFilter, setGenerationsFilter] = useState("");
  
  const { success, error: showError } = useBanner();

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery, statusFilter, levelFilter, categoryFilter, cardStatusFilter, generationsFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadMembersWithCards(),
        loadMemberCategories()
      ]);
    } catch (error) {
      console.error("Failed to load data:", error);
      showError("Failed to load data", "Unable to fetch members data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembersWithCards = async () => {
    try {
      const response = await fetch("/api/members/search?q=&includeCardInfo=true&limit=1000");
      const data = await response.json();
      
      if (response.ok) {
        const membersWithCardData = (data.data || []).filter((member: SearchMember) => 
          member.cardStats?.hasCards
        );
        setMembers(membersWithCardData);
      }
    } catch (error) {
      console.error("Failed to load members with cards:", error);
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

  const filterMembers = () => {
    let filtered = [...members];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        member.firstName.toLowerCase().includes(query) ||
        member.lastName.toLowerCase().includes(query) ||
        (member.membershipId && member.membershipId.toLowerCase().includes(query)) ||
        (member.email && member.email.toLowerCase().includes(query)) ||
        member.phone.includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    // Level filter
    if (levelFilter) {
      filtered = filtered.filter(member => member.membershipLevel === levelFilter);
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(member => member.memberCategory?.id === categoryFilter);
    }

    // Card status filter
    if (cardStatusFilter) {
      filtered = filtered.filter(member => member.cardStats?.latestCardStatus === cardStatusFilter);
    }

    // Generations filter
    if (generationsFilter) {
      const minGenerations = parseInt(generationsFilter);
      filtered = filtered.filter(member => 
        (member.cardStats?.totalGenerations || 0) >= minGenerations
      );
    }

    setFilteredMembers(filtered);
  };

  const generateSingleCard = async (memberId: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/member-id-cards/generate?memberId=${memberId}`);
      
      if (response.ok) {
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
        loadData(); // Refresh the data
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
    if (selectedMembers.length === 0) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch("/api/member-id-cards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "pdf",
          includeBack: true,
          memberIds: selectedMembers,
        }),
      });

      if (response.ok) {
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

        success("Bulk ID cards regenerated!", `${selectedMembers.length} ID cards have been regenerated and downloaded successfully.`);
        setSelectedMembers([]);
        loadData(); // Refresh the data
      } else {
        const errorData = await response.json();
        showError("Failed to regenerate bulk ID cards", errorData.error || "Unknown error occurred");
      }
    } catch {
      showError("Failed to regenerate bulk ID cards", "Network error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = async () => {
    setIsExporting(true);
    try {
      const csvContent = [
        // CSV headers
        ['Member ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Membership Level', 'Category', 'Total Cards', 'Total Generations', 'Latest Card Status', 'Last Generated'].join(','),
        // CSV rows
        ...filteredMembers.map(member => [
          member.membershipId || 'N/A',
          member.firstName,
          member.lastName,
          member.email || 'N/A',
          member.phone,
          member.status,
          member.membershipLevel,
          member.memberCategory?.name || 'N/A',
          member.cardStats?.totalCards || 0,
          member.cardStats?.totalGenerations || 0,
          member.cardStats?.latestCardStatus || 'N/A',
          member.cardStats?.lastGenerated ? new Date(member.cardStats.lastGenerated).toLocaleDateString() : 'N/A'
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members-with-id-cards-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success("Report exported!", "The report has been downloaded successfully.");
    } catch {
      showError("Export failed", "Unable to export the report");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "PROSPECT": return "bg-blue-100 text-blue-800";
      case "INACTIVE": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCardStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "PRINTED": return "bg-blue-100 text-blue-800";
      case "ISSUED": return "bg-green-100 text-green-800";
      case "REVOKED": return "bg-red-100 text-red-800";
      case "EXPIRED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleMemberSelection = (memberId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const selectAllMembers = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(member => member.id));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Loading report...</h3>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    totalMembers: members.length,
    totalGenerations: members.reduce((sum, member) => sum + (member.cardStats?.totalGenerations || 0), 0),
    averageGenerations: members.length > 0 ? (members.reduce((sum, member) => sum + (member.cardStats?.totalGenerations || 0), 0) / members.length).toFixed(1) : 0,
    recentGenerations: members.filter(member => {
      if (!member.cardStats?.lastGenerated) return false;
      const lastGen = new Date(member.cardStats.lastGenerated);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastGen >= thirtyDaysAgo;
    }).length
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Members with ID Cards Report
          </h1>
          <p className="text-muted-foreground">
            View members who have generated ID cards with detailed statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportReport}
            variant="outline"
            disabled={isExporting || filteredMembers.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members with Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalGenerations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Generations</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.averageGenerations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent (30 days)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.recentGenerations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter || "__all_statuses__"} onValueChange={(value) => setStatusFilter(value === "__all_statuses__" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all_statuses__">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROSPECT">Prospect</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Level</label>
              <Select value={levelFilter || "__all_levels__"} onValueChange={(value) => setLevelFilter(value === "__all_levels__" ? "" : value)}>
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
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={categoryFilter || "__all_categories__"} onValueChange={(value) => setCategoryFilter(value === "__all_categories__" ? "" : value)}>
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
            <div>
              <label className="text-sm font-medium mb-2 block">Card Status</label>
              <Select value={cardStatusFilter || "__all_card_statuses__"} onValueChange={(value) => setCardStatusFilter(value === "__all_card_statuses__" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All card statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all_card_statuses__">All card statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PRINTED">Printed</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="REVOKED">Revoked</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Min. Generations</label>
              <Select value={generationsFilter || "__all_generations__"} onValueChange={(value) => setGenerationsFilter(value === "__all_generations__" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all_generations__">All</SelectItem>
                  <SelectItem value="2">2+ generations</SelectItem>
                  <SelectItem value="3">3+ generations</SelectItem>
                  <SelectItem value="5">5+ generations</SelectItem>
                  <SelectItem value="10">10+ generations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedMembers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMembers.length === filteredMembers.length}
                  onChange={selectAllMembers}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedMembers.length} of {filteredMembers.length} members selected
                </span>
              </div>
              <Button
                onClick={generateBulkCards}
                disabled={isGenerating}
                size="sm"
              >
                {isGenerating ? "Regenerating..." : `Regenerate ${selectedMembers.length} Cards`}
                <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members with ID Cards ({filteredMembers.length})</CardTitle>
          <CardDescription>
            Members who have generated ID cards with generation statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters to see more results.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onChange={(e) => handleMemberSelection(member.id, e.target.checked)}
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/5 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>Member ID: {member.membershipId || 'N/A'}</div>
                        <div>Email: {member.email || 'N/A'} • Phone: {member.phone}</div>
                        <div>Level: {member.memberCategory?.name || member.membershipLevel}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="text-sm space-y-1">
                      <div className="font-medium flex items-center gap-1 justify-end">
                        <Hash className="w-3 h-3" />
                        {member.cardStats?.totalGenerations || 0} generation{(member.cardStats?.totalGenerations || 0) !== 1 ? 's' : ''}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {member.cardStats?.lastGenerated ? (
                          `Last: ${new Date(member.cardStats.lastGenerated).toLocaleDateString()}`
                        ) : (
                          'Never generated'
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                      <Badge className={getCardStatusColor(member.cardStats?.latestCardStatus || 'N/A')}>
                        {member.cardStats?.latestCardStatus || 'N/A'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateSingleCard(member.id)}
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
    </div>
  );
}