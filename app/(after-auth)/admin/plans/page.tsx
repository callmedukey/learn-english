import React, { Suspense } from "react";

import CreatePlanDialog from "./components/create-plan-dialog";
import PlansTable from "./components/plans-table";
import { getPlans } from "./queries/plans.query";

export const dynamic = "force-dynamic";

async function PlansContent() {
  // Fetch all plans without filters
  const plansResult = await getPlans();

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Management</h1>
          <p className="mt-1 text-gray-600">
            Create and manage subscription plans for your customers.
          </p>
        </div>
        <CreatePlanDialog />
      </div>

      {/* Table */}
      <PlansTable plans={plansResult.plans} />
    </div>
  );
}

export default function PlansPage() {
  return (
    <div className="px-1">
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500"></div>
          </div>
        }
      >
        <PlansContent />
      </Suspense>
    </div>
  );
}
