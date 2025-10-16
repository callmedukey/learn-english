"use client";

import { format } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentStatus } from "@/prisma/generated/prisma";

import { PaymentFilters } from "../queries/payments.query";

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface PaymentFiltersProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
  plans: Plan[];
}

export default function PaymentFiltersComponent({
  filters,
  onFiltersChange,
  plans,
}: PaymentFiltersProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleSearchSubmit = () => {
    handleFilterChange("search", searchInput || undefined);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof PaymentFilters] !== undefined,
  );

  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Filters</h3>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-base font-medium">Search</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Email, name, order ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearchSubmit} size="sm" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-base font-medium">Status</label>
          <Select
            value={filters.status || "ALL"}
            onValueChange={(value) =>
              handleFilterChange("status", value === "ALL" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
              <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
              <SelectItem value={PaymentStatus.CANCELLED}>Cancelled</SelectItem>
              <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Method Filter */}
        <div className="space-y-2">
          <label className="text-base font-medium">Payment Method</label>
          <Input
            placeholder="Enter payment method..."
            value={filters.method || ""}
            onChange={(e) =>
              handleFilterChange("method", e.target.value || undefined)
            }
          />
        </div>

        {/* Plan Filter */}
        <div className="space-y-2">
          <label className="text-base font-medium">Plan</label>
          <Select
            value={filters.planId || "ALL"}
            onValueChange={(value) =>
              handleFilterChange("planId", value === "ALL" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Plans</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} (₩{plan.price.toLocaleString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <label className="text-base font-medium">From Date</label>
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? (
                  format(filters.dateFrom, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => {
                  handleFilterChange("dateFrom", date);
                  setDateFromOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <label className="text-base font-medium">To Date</label>
          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? (
                  format(filters.dateTo, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => {
                  handleFilterChange("dateTo", date);
                  setDateToOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
