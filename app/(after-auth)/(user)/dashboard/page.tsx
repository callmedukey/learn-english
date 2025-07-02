import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { ContinueLearning } from "@/components/continue-learning/continue-learning";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import { MonthlyLeaderboard } from "@/components/leaderboard/monthly-leaderboard";
import { WinnerPopupContainer } from "@/components/medals/winner-popup-container";
import calculateGrade from "@/lib/utils/calculate-grade";
import { Role, SubscriptionStatus } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import {
  getActivePopups,
  getGlobalWinnersData,
  getUserMonthlyRankings,
} from "@/server-queries/medals";

export const dynamic = "force-dynamic";

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

  // Fetch popup data
  const popups = await getActivePopups(session.user.id);

  // For each popup, fetch the necessary data
  let leaderboardData = undefined;
  let personalRankings = undefined;

  if (popups.length > 0) {
    // Check if we need global winners data
    const globalWinnersPopup = popups.find((p) => p.type === "GLOBAL_WINNERS");
    if (globalWinnersPopup) {
      leaderboardData = await getGlobalWinnersData(
        globalWinnersPopup.year,
        globalWinnersPopup.month,
      );
    }

    // Check if we need personal rankings
    const personalAchievementPopup = popups.find(
      (p) => p.type === "PERSONAL_ACHIEVEMENT",
    );
    if (personalAchievementPopup) {
      personalRankings = await getUserMonthlyRankings(
        session.user.id,
        personalAchievementPopup.year,
        personalAchievementPopup.month,
      );
    }
  }

  return (
    <div className="py-16">
      <WinnerPopupContainer
        popups={popups}
        leaderboardData={leaderboardData}
        personalRankings={personalRankings}
      />
      <MonthlyLeaderboard userId={session.user.id} userGrade={userGrade} />
      <Leaderboard userId={session.user.id} userGrade={userGrade} />
      <ContinueLearning userId={session.user.id} />
    </div>
  );
};

export default page;
