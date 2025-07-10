import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { calculateDaysRemaining } from "@/lib/utils/calculate-days-remaining";
import { prisma } from "@/prisma/prisma-client";

import PlansClient from "./components/plans-client";
import {
  getActivePlans,
  getUserActiveSubscription,
} from "./queries/plans.query";

export default async function PlansPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get user with country information
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { country: true },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Choose Your Plan
          </h1>
          <p className="text-gray-600">
            Select the perfect plan to continue your English learning journey
          </p>
        </div>

        <Suspense fallback={<div>Loading plans...</div>}>
          <PlansContent
            userId={user.id}
            userEmail={user.email}
            userName={user.nickname || "User"}
            userCountry={user.country?.name || null}
          />
        </Suspense>
      </div>
    </div>
  );
}

async function PlansContent({
  userId,
  userEmail,
  userName,
  userCountry,
}: {
  userId: string;
  userEmail: string;
  userName: string;
  userCountry: string | null;
}) {
  const [plans, activeSubscription] = await Promise.all([
    getActivePlans(),
    getUserActiveSubscription(userId),
  ]);

  // If user has an active subscription, show message instead of plans
  if (activeSubscription) {
    const daysLeft = calculateDaysRemaining(activeSubscription.endDate);

    const isKoreanUser = userCountry === "South Korea";
    const hasAutoRenewal = activeSubscription.autoRenew && activeSubscription.recurringStatus === "ACTIVE";

    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 p-4">
          <svg
            className="h-8 w-8 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        {/* Different titles based on renewal status */}
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          {hasAutoRenewal && isKoreanUser
            ? "Active Subscription with Auto-Renewal"
            : "You're Already Subscribed!"}
        </h2>
        
        <p className="mb-4 text-gray-600">
          You currently have an active{" "}
          <strong>{activeSubscription.plan.name}</strong> subscription.
        </p>
        
        {/* Show auto-renewal status for Korean users */}
        {isKoreanUser && hasAutoRenewal && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium">Auto-renewal enabled</span>
            </div>
            {activeSubscription.nextBillingDate && (
              <p className="text-xs text-green-600 mt-1">
                Next billing date: {new Date(activeSubscription.nextBillingDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        )}
        
        <div className="mb-6 rounded-lg bg-white p-4">
          <div className="text-sm text-gray-500">
            {hasAutoRenewal && isKoreanUser 
              ? "Current subscription period ends on"
              : "Your subscription expires on"}
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {new Date(activeSubscription.endDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="text-sm text-amber-600">
            {daysLeft > 0 ? `${daysLeft} days remaining` : "Expires today"}
          </div>
        </div>
        
        {/* Different messages based on auto-renewal status */}
        {hasAutoRenewal && isKoreanUser ? (
          <p className="text-gray-500">
            Your subscription will automatically renew and your service will continue uninterrupted.
            You can cancel auto-renewal anytime from your billing settings.
          </p>
        ) : (
          <p className="text-gray-500">
            You can purchase a new plan after your current subscription expires.
            Check back after{" "}
            {new Date(activeSubscription.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            to continue your learning journey!
          </p>
        )}
        
        {/* Show billing management link for Korean users */}
        {isKoreanUser && (
          <div className="mt-6">
            <a
              href="/profile/billing"
              className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              {hasAutoRenewal ? "Manage Payment & Auto-renewal" : "Manage Payment Method"}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <PlansClient
      plans={plans}
      userId={userId}
      userEmail={userEmail}
      userName={userName}
      userCountry={userCountry}
    />
  );
}
