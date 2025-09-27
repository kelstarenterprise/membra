"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useBanner } from "@/components/providers/banner-provider";
import { Download, UserX, Users, Search, FileText, Plus, Filter, RefreshCw } from "lucide-react";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  membershipId: string | null;
  status: string;
  membershipLevel: string;
  email: string | null;
  phone: string;
  memberCategory?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface MemberCategory {
  id: string;
  code: string;
  name: string;
}

export default function MembersWithoutIdCardsReport() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberCategories, setMemberCategories] = useState<MemberCategory[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  const { success, error: showError } = useBanner();

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery, statusFilter, levelFilter, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadMembersWithoutCards(),
        loadMemberCategories()
      ]);
    } catch (error) {
      console.error("Failed to load data:", error);
      showError("Failed to load data", "Unable to fetch members data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembersWithoutCards = async () => {
    try {
      // Use the member search API with card info to get all members
      const response = await fetch("/api/members/search?q=&includeCardInfo=true&limit=1000");
      const data = await response.json();
      
      if (response.ok) {
        const allMembers = data.data || [];
        
        // Filter members who DON'T have ID cards
        const membersWithoutCards = allMembers.filter((member: { cardStats?: { hasCards?: boolean } }) => 
          !member.cardStats?.hasCards
        );
        
        console.log('Total members fetched:', allMembers.length);
        console.log('Members without cards:', membersWithoutCards.length);
        console.log('Sample member with cards:', allMembers.find((m: { cardStats?: { hasCards?: boolean } }) => m.cardStats?.hasCards));
        console.log('Sample member without cards:', membersWithoutCards[0]);
        
        setMembers(membersWithoutCards);
      } else {
        showError("Failed to load members", data.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Failed to load members without cards:", error);
      showError("Failed to load members", "Network error occurred");
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

        success("Bulk ID cards generated!", `${selectedMembers.length} ID cards have been generated and downloaded successfully.`);
        setSelectedMembers([]);
        loadData(); // Refresh the data
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

  const exportReport = async () => {
    setIsExporting(true);
    try {
      const csvContent = [
        // CSV headers
        ['Member ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Membership Level', 'Category'].join(','),
        // CSV rows
        ...filteredMembers.map(member => [
          member.membershipId || 'N/A',
          member.firstName,
          member.lastName,
          member.email || 'N/A',
          member.phone,
          member.status,
          member.membershipLevel,
          member.memberCategory?.name || 'N/A'
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members-without-id-cards-${new Date().toISOString().split('T')[0]}.csv`;
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
            <UserX className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Loading report...</h3>
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Members without ID Cards Report
          </h1>
          <p className="text-muted-foreground">
            View and manage members who haven&apos;t generated ID cards yet
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
            <CardTitle className="text-sm font-medium">Total Without Cards</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredMembers.filter(member => member.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredMembers.filter(member => member.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filteredMembers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name, email, phone, member ID..."
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
              <label className="text-sm font-medium mb-2 block">Membership Level</label>
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
                {isGenerating ? "Generating..." : `Generate ${selectedMembers.length} Cards`}
                <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members without ID Cards ({filteredMembers.length})</CardTitle>
          <CardDescription>
            Members who haven&apos;t generated ID cards yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {members.length === 0 
                  ? "All members have generated ID cards!" 
                  : "Try adjusting your filters to see more results."
                }
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
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/5 rounded-full flex items-center justify-center">
                      <UserX className="w-6 h-6 text-orange-600" />
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
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => generateSingleCard(member.id)}
                      disabled={isGenerating}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Card
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