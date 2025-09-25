"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  membershipLevel?: string | null;
  memberCategory?: {
    name: string;
  } | null;
};

interface MemberSearchProps {
  selectedIds: string[];
  onSelectionChange: (memberIds: string[]) => void;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  maxHeight?: string;
}

export default function MemberSearch({
  selectedIds,
  onSelectionChange,
  label = "Search Members",
  placeholder = "Type name, email or category",
  multiple = true,
  maxHeight = "max-h-64"
}: MemberSearchProps) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch members with debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const url = query.trim()
          ? `/api/members?q=${encodeURIComponent(query.trim())}`
          : "/api/members";
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMembers(data.data || []);
        } else {
          console.error("Failed to fetch members:", response.statusText);
          setMembers([]);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Keep track of all selected members, even if they're not in current search results
  const [allSelectedMembers, setAllSelectedMembers] = useState<Member[]>([]);
  
  const selectedMembers = useMemo(() => {
    // Combine members from current search results and previously selected members
    const fromCurrentSearch = members.filter(member => selectedIds.includes(member.id));
    const fromPreviouslySelected = allSelectedMembers.filter(member => 
      selectedIds.includes(member.id) && !members.find(m => m.id === member.id)
    );
    return [...fromCurrentSearch, ...fromPreviouslySelected];
  }, [members, selectedIds, allSelectedMembers]);

  const handleMemberToggle = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    
    // Check if member is active (prevent selection of inactive members)
    if (member && !['PROSPECT', 'PENDING', 'ACTIVE'].includes(member.status)) {
      return; // Don't allow selection of suspended members
    }
    
    if (multiple) {
      const newSelection = selectedIds.includes(memberId)
        ? selectedIds.filter(id => id !== memberId)
        : [...selectedIds, memberId];
      onSelectionChange(newSelection);
      
      // Add to allSelectedMembers if selecting and not already there
      if (member && !selectedIds.includes(memberId) && !allSelectedMembers.find(m => m.id === memberId)) {
        setAllSelectedMembers(prev => [...prev, member]);
      }
    } else {
      onSelectionChange(selectedIds.includes(memberId) ? [] : [memberId]);
      setShowDropdown(false);
      
      // Add to allSelectedMembers if selecting
      if (member && !selectedIds.includes(memberId) && !allSelectedMembers.find(m => m.id === memberId)) {
        setAllSelectedMembers([member]);
      }
    }
  };

  const handleRemoveMember = (memberId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== memberId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
        />
        
        {/* Dropdown */}
        {showDropdown && (
          <div className={`absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg ${maxHeight} overflow-auto`}>
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                No members found
              </div>
            ) : (
              <div className="py-1">
                {members.map((member) => {
                  const isSelected = selectedIds.includes(member.id);
                  const memberName = `${member.firstName} ${member.lastName}`;
                  const categoryName = member.memberCategory?.name || member.membershipLevel || "No Category";
                  
                  // Check if member is active (not suspended)
                  const isActive = ['PROSPECT', 'PENDING', 'ACTIVE'].includes(member.status);
                  const isDisabled = !isActive;
                  
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-2 px-3 py-2 ${
                        isDisabled 
                          ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                          : 'hover:bg-accent cursor-pointer'
                      }`}
                      onClick={() => isActive && handleMemberToggle(member.id)}
                    >
                      {multiple && (
                        <Checkbox
                          checked={isSelected}
                          onChange={() => isActive && handleMemberToggle(member.id)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={isDisabled}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{memberName}</span>
                          {isDisabled && (
                            <span className="px-1 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                              {member.status}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.email} • {categoryName}
                          {isDisabled && ' • Cannot assign dues'}
                        </div>
                      </div>
                      {!multiple && isSelected && (
                        <div className="text-green-600">✓</div>
                      )}
                      {!multiple && isDisabled && (
                        <div className="text-red-500">⚠</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Members Display */}
      {selectedMembers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Selected ({selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''})
            </span>
            {multiple && selectedMembers.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <Badge
                key={member.id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {member.firstName} {member.lastName}
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}