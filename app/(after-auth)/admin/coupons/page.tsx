import React, { Suspense } from "react";

import { requireAdminAccess } from "@/lib/utils/admin-route-protection";

import CouponFiltersComponent from "./components/coupon-filters";
import CouponsTable from "./components/coupons-table";
import CreateCouponDialog from "./components/create-coupon-dialog";
import { getCoupons, CouponFilters } from "./queries/coupons.query";

interface CouponsPageProps {
  searchParams: Promise<{
    search?: string;
    active?: string;
  }>;
}

export const dynamic = "force-dynamic";

async function CouponsContent({ searchParams }: CouponsPageProps) {
  const params = await searchParams;

  // Parse search params
  const filters: CouponFilters = {};

  if (params.search) {
    filters.search = params.search;
  }

  if (params.active !== undefined) {
    filters.active = params.active === "true";
  }

  // Fetch initial data
  const couponsResult = await getCoupons({ filters });

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Coupon Management
          </h1>
          <p className="mt-1 text-gray-600">
            Create and manage discount coupons for your customers.
          </p>
        </div>
        <CreateCouponDialog />
      </div>

      {/* Filters */}
      <CouponFiltersComponent filters={filters} />

      {/* Table */}
      <CouponsTable coupons={couponsResult.coupons} />
    </div>
  );
}

export default async function CouponsPage({ searchParams }: CouponsPageProps) {
  await requireAdminAccess();
  
  return (
    <div className="px-1">
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <CouponsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
