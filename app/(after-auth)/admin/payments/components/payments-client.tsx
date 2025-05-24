"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import PaymentFiltersComponent from "./payment-filters";
import PaymentPagination from "./payment-pagination";
import PaymentStats from "./payment-stats";
import PaymentTable from "./payment-table";
import { PaymentFilters, PaymentWithDetails } from "../queries/payments.query";

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  successRate: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaymentsClientProps {
  initialPayments: PaymentWithDetails[];
  initialPagination: PaginationInfo;
  initialStats: PaymentStats;
  plans: Plan[];
}

export default function PaymentsClient({
  initialPayments,
  initialPagination,
  initialStats,
  plans,
}: PaymentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<PaymentFilters>(() => {
    const params = new URLSearchParams(searchParams.toString());
    return {
      status: (params.get("status") as any) || undefined,
      method: (params.get("method") as any) || undefined,
      search: params.get("search") || undefined,
      planId: params.get("planId") || undefined,
      dateFrom: params.get("dateFrom")
        ? new Date(params.get("dateFrom")!)
        : undefined,
      dateTo: params.get("dateTo")
        ? new Date(params.get("dateTo")!)
        : undefined,
    };
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });

  // Update URL when filters or page changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.status && filters.status !== "ALL")
      params.set("status", filters.status);
    if (filters.method && filters.method !== "ALL")
      params.set("method", filters.method);
    if (filters.search) params.set("search", filters.search);
    if (filters.planId && filters.planId !== "ALL")
      params.set("planId", filters.planId);
    if (filters.dateFrom)
      params.set("dateFrom", filters.dateFrom.toISOString());
    if (filters.dateTo) params.set("dateTo", filters.dateTo.toISOString());
    if (currentPage > 1) params.set("page", currentPage.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/admin/payments${newUrl}`, { scroll: false });
  }, [filters, currentPage, router]);

  const handleFiltersChange = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <PaymentStats stats={initialStats} />

      {/* Filters */}
      <PaymentFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        plans={plans}
      />

      {/* Table */}
      <PaymentTable payments={initialPayments} />
      <PaymentPagination
        pagination={initialPagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
