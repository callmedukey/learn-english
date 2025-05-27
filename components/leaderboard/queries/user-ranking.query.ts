"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface UserRankingData {
  overallRankingPercentage: string;
  gradeRankingPercentage: string;
  totalUsers: number;
  usersInGrade: number;
  userRank: number;
  userRankInGrade: number;
}

export async function getUserRanking(
  userId: string,
): Promise<UserRankingData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ARScore: true,
      RCScore: true,
    },
  });

  if (!user) {
    return null;
  }

  // Calculate user's total score
  const userTotalScore =
    user.ARScore.reduce((sum, score) => sum + score.score, 0) +
    user.RCScore.reduce((sum, score) => sum + score.score, 0);

  // Get all users with their scores
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      birthday: true,
      ARScore: {
        select: {
          score: true,
        },
      },
      RCScore: {
        select: {
          score: true,
        },
      },
    },
  });

  // Calculate total scores for all users
  const userScores = allUsers.map((u) => {
    const totalScore =
      u.ARScore.reduce((sum, score) => sum + score.score, 0) +
      u.RCScore.reduce((sum, score) => sum + score.score, 0);
    return {
      id: u.id,
      score: totalScore,
      grade: calculateGrade(u.birthday),
    };
  });

  // Filter out users with zero scores for ranking
  const activeUsers = userScores.filter((u) => u.score > 0);

  // If user has no score, they're not ranked
  if (userTotalScore === 0) {
    return {
      overallRankingPercentage: "Unranked",
      gradeRankingPercentage: "Unranked",
      totalUsers: activeUsers.length,
      usersInGrade: activeUsers.filter(
        (u) => u.grade === calculateGrade(user.birthday),
      ).length,
      userRank: 0,
      userRankInGrade: 0,
    };
  }

  // Sort active users by score (descending)
  activeUsers.sort((a, b) => b.score - a.score);

  // Calculate overall ranking
  const userRank = activeUsers.findIndex((u) => u.id === userId) + 1;
  const totalUsers = activeUsers.length;

  // Handle edge case where user is the only one
  if (totalUsers === 0) {
    return {
      overallRankingPercentage: "Top 100%",
      gradeRankingPercentage: "Top 100%",
      totalUsers: 1,
      usersInGrade: 1,
      userRank: 1,
      userRankInGrade: 1,
    };
  }

  const overallPercentile = ((totalUsers - userRank + 1) / totalUsers) * 100;

  // Calculate grade-specific ranking
  const userGrade = calculateGrade(user.birthday);
  const activeUsersInSameGrade = activeUsers.filter(
    (u) => u.grade === userGrade,
  );
  const userRankInGrade =
    activeUsersInSameGrade.findIndex((u) => u.id === userId) + 1;
  const usersInGrade = activeUsersInSameGrade.length;

  // Handle edge case for grade ranking
  const gradePercentile =
    usersInGrade > 0
      ? ((usersInGrade - userRankInGrade + 1) / usersInGrade) * 100
      : 100;

  return {
    overallRankingPercentage: `Top ${Math.ceil(overallPercentile)}%`,
    gradeRankingPercentage: `Top ${Math.ceil(gradePercentile)}%`,
    totalUsers,
    usersInGrade,
    userRank,
    userRankInGrade,
  };
}
