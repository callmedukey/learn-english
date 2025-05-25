"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plan } from "@/prisma/generated/prisma";

interface PaymentFiltersProps {
  plans: Plan[];
}

export default function PaymentFilters({ plans }: PaymentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`?${params.toString()}`);
  };

  const currentPlan = searchParams.get("planId") || "ALL";
  const currentDateRange = searchParams.get("dateRange") || "ALL";
  const currentSort = searchParams.get("sortBy") || "latest";

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-gray-900">Filter Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Plan Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Plan</label>
            <Select
              value={currentPlan}
              onValueChange={(value) => updateSearchParams("planId", value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Plans</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Date Range
            </label>
            <Select
              value={currentDateRange}
              onValueChange={(value) => updateSearchParams("dateRange", value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                <SelectItem value="1month">Last 1 Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
                <SelectItem value="5years">Last 5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sort By</label>
            <Select
              value={currentSort}
              onValueChange={(value) => updateSearchParams("sortBy", value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder="Latest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
