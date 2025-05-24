"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CouponFilters } from "../queries/coupons.query";

interface CouponFiltersProps {
  filters: CouponFilters;
}

export default function CouponFiltersComponent({
  filters,
}: CouponFiltersProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const updateURL = (newFilters: CouponFilters) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.active !== undefined)
      params.set("active", newFilters.active.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`/admin/coupons${newUrl}`);
  };

  const handleFilterChange = (
    key: keyof CouponFilters,
    value: string | boolean | undefined,
  ) => {
    updateURL({
      ...filters,
      [key]: value,
    });
  };

  const handleSearch = () => {
    updateURL({
      ...filters,
      search: searchInput || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    router.push("/admin/coupons");
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof CouponFilters] !== undefined,
  );

  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-gray-600"
          >
            <X className="mr-1 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search by coupon code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} size="sm">
              Search
            </Button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={
              filters.active === undefined ? "ALL" : filters.active.toString()
            }
            onValueChange={(value) =>
              handleFilterChange(
                "active",
                value === "ALL" ? undefined : value === "true",
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
