import { Plus } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { canCreateBPALevel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";

import BPALevelTableWrapper from "./components/bpa-level-table-wrapper";
import TimeframeConfig from "./components/timeframe-config";

const BPAAdminPage = async () => {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  return (
    <div className="space-y-8 px-1">
      {/* Timeframe Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">BPA Timeframes</h2>
            <p className="text-sm text-gray-600">
              Configure timeframes for BPA challenges (each timeframe spans all 4
              seasons)
            </p>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="py-8 text-center">Loading timeframes...</div>
          }
        >
          <TimeframeConfig />
        </Suspense>
      </div>

      {/* BPA Levels Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">BPA Levels</h1>
            <p className="text-sm text-gray-600">
              Manage BPA levels and their novels
            </p>
          </div>
          {canCreateBPALevel(userRole) && (
            <Button asChild>
              <Link href="/admin/bpa/create">
                <Plus className="h-4 w-4" />
                Create Level
              </Link>
            </Button>
          )}
        </div>

        <Suspense
          fallback={
            <div className="py-8 text-center">Loading BPA levels...</div>
          }
        >
          <BPALevelTableWrapper />
        </Suspense>
      </div>
    </div>
  );
};

export default BPAAdminPage;
