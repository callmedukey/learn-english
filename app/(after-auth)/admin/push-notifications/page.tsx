import React, { Suspense } from "react";

import { requireAdminAccess } from "@/lib/utils/admin-route-protection";
import { prisma } from "@/prisma/prisma-client";

import { getCampaignHistoryAction } from "./actions/push.actions";
import CampaignHistory from "./components/campaign-history";
import PushNotificationForm from "./components/push-form";

export const dynamic = "force-dynamic";

export default async function PushNotificationsPage() {
  await requireAdminAccess();

  const [campuses, countries, historyData] = await Promise.all([
    prisma.campus.findMany({ orderBy: { name: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    getCampaignHistoryAction(1, 10),
  ]);

  return (
    <div className="px-1">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Push Notifications
          </h1>
          <p className="mt-1 text-gray-600">
            Send push notifications to mobile app users
          </p>
        </div>

        {/* Send Form */}
        <Suspense
          fallback={
            <div className="animate-pulse rounded-lg bg-gray-100 p-8">
              Loading form...
            </div>
          }
        >
          <PushNotificationForm campuses={campuses} countries={countries} />
        </Suspense>

        {/* Campaign History */}
        <Suspense
          fallback={
            <div className="animate-pulse rounded-lg bg-gray-100 p-8">
              Loading history...
            </div>
          }
        >
          <CampaignHistory
            initialCampaigns={historyData.campaigns}
            total={historyData.total}
          />
        </Suspense>
      </div>
    </div>
  );
}
