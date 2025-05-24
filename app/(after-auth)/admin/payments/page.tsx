import React, { Suspense } from "react";

import { PaymentStatus, PaymentMethod } from "@/prisma/generated/prisma";

import PaymentsClient from "./components/payments-client";
import {
  getPayments,
  getPaymentStats,
  getPlansForFilter,
  PaymentFilters,
} from "./queries/payments.query";

interface PaymentsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    method?: string;
    search?: string;
    planId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

async function PaymentsContent({ searchParams }: PaymentsPageProps) {
  const params = await searchParams;

  // Parse search params
  const page = parseInt(params.page || "1", 10);
  const filters: PaymentFilters = {};

  if (
    params.status &&
    params.status !== "ALL" &&
    Object.values(PaymentStatus).includes(params.status as PaymentStatus)
  ) {
    filters.status = params.status as PaymentStatus;
  }

  if (
    params.method &&
    params.method !== "ALL" &&
    Object.values(PaymentMethod).includes(params.method as PaymentMethod)
  ) {
    filters.method = params.method as PaymentMethod;
  }

  if (params.search) {
    filters.search = params.search;
  }

  if (params.planId && params.planId !== "ALL") {
    filters.planId = params.planId;
  }

  if (params.dateFrom) {
    filters.dateFrom = new Date(params.dateFrom);
  }

  if (params.dateTo) {
    filters.dateTo = new Date(params.dateTo);
  }

  // Fetch data directly in server component
  const [paymentsResult, stats, plans] = await Promise.all([
    getPayments({ page, filters }),
    getPaymentStats(),
    getPlansForFilter(),
  ]);

  return (
    <PaymentsClient
      initialPayments={paymentsResult.payments}
      initialPagination={paymentsResult.pagination}
      initialStats={stats}
      plans={plans}
    />
  );
}

export default function PaymentsPage({ searchParams }: PaymentsPageProps) {
  return (
    <div className="px-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <p className="mt-1 text-gray-600">
          Monitor and manage all payment transactions, subscriptions, and
          revenue.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <PaymentsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
