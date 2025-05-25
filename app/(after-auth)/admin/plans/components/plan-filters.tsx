"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PlanFilters } from "../queries/plans.query";

interface PlanFiltersProps {
  filters: PlanFilters;
}

export default function PlanFiltersComponent({ filters }: PlanFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localFilters, setLocalFilters] = useState<PlanFilters>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof PlanFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    updateURL(newFilters);
  };

  const updateURL = (newFilters: PlanFilters) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update search param
    if (newFilters.search) {
      params.set("search", newFilters.search);
    } else {
      params.delete("search");
    }

    // Update active param
    if (newFilters.active !== undefined) {
      params.set("active", newFilters.active.toString());
    } else {
      params.delete("active");
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/admin/plans${newUrl}`, { scroll: false });
  };

  const clearFilters = () => {
    const clearedFilters: PlanFilters = {};
    setLocalFilters(clearedFilters);
    router.replace("/admin/plans", { scroll: false });
  };

  const hasActiveFilters =
    localFilters.search || localFilters.active !== undefined;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          {/* Search Input */}
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search plans..."
              value={localFilters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-[150px]">
            <Select
              value={
                localFilters.active === undefined
                  ? "all"
                  : localFilters.active
                    ? "active"
                    : "inactive"
              }
              onValueChange={(value) => {
                const activeValue =
                  value === "all" ? undefined : value === "active";
                handleFilterChange("active", activeValue);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
