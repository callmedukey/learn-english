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

  // Calculate percentile - what percentage of users you're better than
  let overallPercentile: number;
  if (totalUsers === 1) {
    // If you're the only user, you're in the top 1%
    overallPercentile = 1;
  } else {
    // Calculate what percentage of users are below you
    const usersBelowYou = totalUsers - userRank;
    const percentageBelowYou = (usersBelowYou / (totalUsers - 1)) * 100;
    // You're in the top X%, where X = 100 - percentage below you
    overallPercentile = Math.max(1, 100 - percentageBelowYou);
  }

  // Calculate grade-specific ranking
  const userGrade = calculateGrade(user.birthday);
  const activeUsersInSameGrade = activeUsers.filter(
    (u) => u.grade === userGrade,
  );
  const userRankInGrade =
    activeUsersInSameGrade.findIndex((u) => u.id === userId) + 1;
  const usersInGrade = activeUsersInSameGrade.length;

  // Calculate grade percentile
  let gradePercentile: number;
  if (usersInGrade === 1) {
    // If you're the only user in your grade, you're in the top 1%
    gradePercentile = 1;
  } else if (usersInGrade > 1) {
    // Calculate what percentage of users in your grade are below you
    const usersBelowYouInGrade = usersInGrade - userRankInGrade;
    const percentageBelowYouInGrade =
      (usersBelowYouInGrade / (usersInGrade - 1)) * 100;
    // You're in the top X%, where X = 100 - percentage below you
    gradePercentile = Math.max(1, 100 - percentageBelowYouInGrade);
  } else {
    gradePercentile = 1;
  }

  return {
    overallRankingPercentage: `Top ${Math.ceil(overallPercentile)}%`,
    gradeRankingPercentage: `Top ${Math.ceil(gradePercentile)}%`,
    totalUsers,
    usersInGrade,
    userRank,
    userRankInGrade,
  };
}
