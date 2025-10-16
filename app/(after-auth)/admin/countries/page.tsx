import React, { Suspense } from "react";

import { requireAdminAccess } from "@/lib/utils/admin-route-protection";

import AddCountryDialog from "./components/add-country-dialog";
import CountriesTable from "./components/countries-table";

const PageLoading = () => {
  return (
    <div className="flex h-32 items-center justify-center">
      <p className="text-xl text-gray-500">Loading countries...</p>
    </div>
  );
};

const Page = async () => {
  await requireAdminAccess();
  
  return (
    <div className="px-1 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="w-full text-center text-2xl font-bold">Countries</h1>
        <AddCountryDialog />
      </div>

      <div className="mt-0">
        <Suspense fallback={<PageLoading />}>
          <CountriesTable />
        </Suspense>
      </div>
    </div>
  );
};

export default Page;
