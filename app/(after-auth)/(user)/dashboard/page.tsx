import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { ContinueLearning } from "@/components/continue-learning/continue-learning";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import calculateGrade from "@/lib/utils/calculate-grade";
import { Role, SubscriptionStatus } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const page = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === Role.ADMIN) {
    redirect("/admin");
  }

  // Optimize: Combine user data fetch with subscription cleanup in a transaction
  const [user] = await Promise.all([
    // Get user's birthday to calculate grade
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { birthday: true },
    }),
    // Bulk update expired subscriptions in a single query
    prisma.userSubscription.updateMany({
      where: {
        userId: session.user.id,
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lt: new Date(),
        },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    }),
  ]);

  const userGrade = calculateGrade(user?.birthday || null);

  return (
    <div className="py-16">
      <Leaderboard userId={session.user.id} userGrade={userGrade} />
      <ContinueLearning userId={session.user.id} />
    </div>
  );
};

export default page;
