import { redirect } from "next/navigation";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Skeleton } from "@/components/ui/skeleton";

import PaymentFilters from "./components/payment-filters";
import PaymentTable from "./components/payment-table";
import {
  getUserPayments,
  getPlansForUserFilter,
  UserPaymentFilters,
} from "../queries/payments.query";

interface PaymentsPageProps {
  searchParams: Promise<{
    planId?: string;
    dateRange?: "3months" | "1month" | "1year" | "5years" | "ALL";
    sortBy?: "latest" | "oldest";
  }>;
}

async function PaymentsContent({
  userId,
  filters,
}: {
  userId: string;
  filters: UserPaymentFilters;
}) {
  const [payments, plans] = await Promise.all([
    getUserPayments(userId, filters),
    getPlansForUserFilter(),
  ]);

  return (
    <>
      <PaymentFilters plans={plans} />
      <PaymentTable payments={payments} />
    </>
  );
}

function PaymentsLoading() {
  return (
    <div className="space-y-6">
      {/* Filter skeleton */}
      <div className="rounded-lg border p-6">
        <div className="mb-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border p-6">
        <div className="mb-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-28" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const resolvedSearchParams = await searchParams;

  const filters: UserPaymentFilters = {
    planId: resolvedSearchParams.planId || "ALL",
    dateRange: resolvedSearchParams.dateRange || "ALL",
    sortBy: resolvedSearchParams.sortBy || "latest",
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Payment History
          </h1>
          <p className="text-gray-600">
            View and manage your payment history and subscription details
          </p>
        </div>

        <Suspense fallback={<PaymentsLoading />}>
          <PaymentsContent userId={session.user.id} filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
