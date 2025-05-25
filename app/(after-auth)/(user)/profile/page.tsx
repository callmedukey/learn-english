import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";

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
            userId={session.user.id!}
            userEmail={session.user.email!}
            userName={session.user.nickname || "User"}
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
}: {
  userId: string;
  userEmail: string;
  userName: string;
}) {
  const [plans, activeSubscription] = await Promise.all([
    getActivePlans(),
    getUserActiveSubscription(userId),
  ]);

  // If user has an active subscription, show message instead of plans
  if (activeSubscription) {
    const daysLeft = Math.ceil(
      (new Date(activeSubscription.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );

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
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          You&apos;re Already Subscribed!
        </h2>
        <p className="mb-4 text-gray-600">
          You currently have an active{" "}
          <strong>{activeSubscription.plan.name}</strong> subscription.
        </p>
        <div className="mb-6 rounded-lg bg-white p-4">
          <div className="text-sm text-gray-500">
            Your subscription expires on
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
        <p className="text-gray-500">
          You can purchase a new plan after your current subscription expires.
          Check back after{" "}
          {new Date(activeSubscription.endDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          to continue your learning journey!
        </p>
      </div>
    );
  }

  return (
    <PlansClient
      plans={plans}
      userId={userId}
      userEmail={userEmail}
      userName={userName}
    />
  );
}
