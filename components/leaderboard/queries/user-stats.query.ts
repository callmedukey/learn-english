"server only";

import { prisma } from "@/prisma/prisma-client";

export interface UserStatsData {
  novelScore: number;
  rcScore: number;
  totalScore: number;
  percentile: number;
}

export async function getUserStats(userId: string): Promise<UserStatsData> {
  // Get user's total score
  const userTotalScore = await prisma.totalScore.findUnique({
    where: { userId },
  });

  // Get user's AR scores sum using aggregate
  const userARScoresSum = await prisma.aRScore.aggregate({
    where: { userId },
    _sum: {
      score: true,
    },
  });

  // Get user's RC scores sum using aggregate
  const userRCScoresSum = await prisma.rCScore.aggregate({
    where: { userId },
    _sum: {
      score: true,
    },
  });

  // Calculate totals
  const novelScore = userARScoresSum._sum.score || 0;
  const rcScore = userRCScoresSum._sum.score || 0;
  const totalScore = userTotalScore?.score || novelScore + rcScore;

  // Calculate percentile
  const allTotalScores = await prisma.totalScore.findMany({
    select: { score: true },
    orderBy: { score: "desc" },
  });

  let percentile = 100;
  if (allTotalScores.length > 0) {
    const userRank =
      allTotalScores.findIndex((score) => score.score <= totalScore) + 1;
    percentile = Math.round((userRank / allTotalScores.length) * 100);
  }

  return {
    novelScore,
    rcScore,
    totalScore,
    percentile,
  };
}
