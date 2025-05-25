import { redirect } from "next/navigation";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Skeleton } from "@/components/ui/skeleton";

import { getUserSettings } from "../queries/user.query";
import SettingsContentWrapper from "./components/settings-content-wrapper";

async function SettingsContent({ userId }: { userId: string }) {
  const userSettings = await getUserSettings(userId);

  return (
    <SettingsContentWrapper
      userId={userId}
      initialUserSettings={userSettings}
    />
  );
}

function SettingsLoading() {
  return (
    <div className="space-y-8">
      {/* User Information Loading */}
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-1 h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-12" />
            <Skeleton className="mt-1 h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-1 h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Gender Update Loading */}
      <div className="border-t border-gray-200 pt-8">
        <div className="space-y-4">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-1 h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Password Change Loading */}
      <div className="border-t border-gray-200 pt-8">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-1 h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-1 h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <Suspense fallback={<SettingsLoading />}>
            <SettingsContent userId={session.user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
