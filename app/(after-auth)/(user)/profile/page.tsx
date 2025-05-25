import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";

import PlansClient from "./components/plans-client";
import { getActivePlans } from "./queries/plans.query";

export default async function PlansPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
            userName={session.user.name || "User"}
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
  const plans = await getActivePlans();

  return (
    <PlansClient
      plans={plans}
      userId={userId}
      userEmail={userEmail}
      userName={userName}
    />
  );
}
