"use client";

import {
  Search,
  SortAsc,
  SortDesc,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";

interface RCKeywordFiltersProps {
  rcLevelId: string;
}

export function RCKeywordFilters({ rcLevelId }: RCKeywordFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sortOrder") || "desc",
  );
  const [status, setStatus] = useState(searchParams.get("status") || "all");

  // Debounce the search input to avoid updating URL on every keystroke
  const debouncedSearchInput = useDebounce(searchInput, 500);

  // Track if we're waiting for debounce
  const isSearchPending = searchInput !== debouncedSearchInput;

  const hasActiveFilters =
    searchInput.trim() !== "" ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc" ||
    status !== "all";

  const updateFilters = useCallback(
    (overrideSearch?: string) => {
      const params = new URLSearchParams();

      const searchValue =
        overrideSearch !== undefined ? overrideSearch : debouncedSearchInput;

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      if (sortBy !== "createdAt") {
        params.set("sortBy", sortBy);
      }

      if (sortOrder !== "desc") {
        params.set("sortOrder", sortOrder);
      }

      if (status !== "all") {
        params.set("status", status);
      }

      const queryString = params.toString();
      router.push(`/rc/${rcLevelId}${queryString ? `?${queryString}` : ""}`);
    },
    [rcLevelId, router, debouncedSearchInput, sortBy, sortOrder, status],
  );

  // Update URL when debounced search input changes
  useEffect(() => {
    updateFilters();
  }, [debouncedSearchInput, updateFilters]);

  // Auto-apply filters when select values change (immediate, no debounce needed)
  useEffect(() => {
    updateFilters();
  }, [sortBy, sortOrder, status, updateFilters]);

  // Auto-expand if there are active filters
  useEffect(() => {
    if (hasActiveFilters) {
      setIsExpanded(true);
    }
  }, [hasActiveFilters]);

  const clearFilters = () => {
    setSearchInput("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setStatus("all");
    router.push(`/rc/${rcLevelId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Force immediate update on Enter key
      updateFilters(searchInput);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-border bg-card">
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-card-foreground">
            Filters
          </h3>
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
          )}
          {isSearchPending && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Searching...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-4 w-4" />
              Clear All
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Show</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-4 px-4 pb-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Search
              </label>
              <div className="relative">
                {isSearchPending ? (
                  <Loader2 className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform animate-spin text-muted-foreground" />
                ) : (
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                )}
                <Input
                  placeholder="Search topics and titles..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Order
              </label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    <div className="flex items-center">
                      <SortAsc className="mr-2 h-4 w-4" />
                      Ascending
                    </div>
                  </SelectItem>
                  <SelectItem value="desc">
                    <div className="flex items-center">
                      <SortDesc className="mr-2 h-4 w-4" />
                      Descending
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="inProgress">In Progress</SelectItem>
                  <SelectItem value="notStarted">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
