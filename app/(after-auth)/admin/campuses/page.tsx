import React, { Suspense } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  isFullAdmin,
  requireAdminOrSubAdminAccess,
} from "@/lib/utils/admin-route-protection";

import AddCampusDialog from "./components/add-campus-dialog";
import CampusRequestsTable from "./components/campus-requests-table";
import CampusesTable from "./components/campuses-table";
import { getPendingCampusRequestsCount } from "./query/campus-requests.query";

const PageLoading = () => {
  return (
    <div className="flex h-32 items-center justify-center">
      <p className="text-xl text-gray-500">Loading...</p>
    </div>
  );
};

const Page = async () => {
  const session = await requireAdminOrSubAdminAccess();
  const userIsFullAdmin = isFullAdmin(session.user.role);

  // Both admins and sub-admins can view and manage pending requests
  const pendingCount = await getPendingCampusRequestsCount();

  return (
    <div className="px-1 py-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="w-full text-center text-2xl font-bold">
          Campus Management
        </h1>
        {userIsFullAdmin && <AddCampusDialog />}
      </div>

      <Tabs defaultValue="campuses" className="w-full">
        <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="campuses">Campuses</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Pending Requests
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-sm font-bold leading-none text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campuses" className="mt-6">
          <Suspense fallback={<PageLoading />}>
            <CampusesTable showActions={userIsFullAdmin} />
          </Suspense>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Suspense fallback={<PageLoading />}>
            <CampusRequestsTable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Page;
