"server only";

import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface MonthlyUserRankingData {
  overallRankingPercentage: string;
  gradeRankingPercentage: string;
  totalUsers: number;
  usersInGrade: number;
  userRank: number;
  userRankInGrade: number;
}

export async function getMonthlyUserRanking(
  userId: string,
): Promise<MonthlyUserRankingData | null> {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  // Get user's birthday for grade calculation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      birthday: true,
    },
  });

  if (!user) {
    return null;
  }

  // Get user's monthly scores
  const [userARScores, userRCScores] = await Promise.all([
    prisma.monthlyARScore.aggregate({
      where: {
        userId,
        year,
        month,
      },
      _sum: {
        score: true,
      },
    }),
    prisma.monthlyRCScore.aggregate({
      where: {
        userId,
        year,
        month,
      },
      _sum: {
        score: true,
      },
    }),
  ]);

  const userTotalScore =
    (userARScores._sum.score || 0) + (userRCScores._sum.score || 0);

  // Get all users' monthly scores
  const [allARScores, allRCScores] = await Promise.all([
    prisma.monthlyARScore.groupBy({
      by: ["userId"],
      where: {
        year,
        month,
      },
      _sum: {
        score: true,
      },
    }),
    prisma.monthlyRCScore.groupBy({
      by: ["userId"],
      where: {
        year,
        month,
      },
      _sum: {
        score: true,
      },
    }),
  ]);

  // Create maps for quick lookup
  const arScoreMap = new Map(
    allARScores.map((s) => [s.userId, s._sum.score || 0]),
  );
  const rcScoreMap = new Map(
    allRCScores.map((s) => [s.userId, s._sum.score || 0]),
  );

  // Get all unique user IDs with monthly scores
  const allUserIds = Array.from(
    new Set([
      ...allARScores.map((s) => s.userId),
      ...allRCScores.map((s) => s.userId),
    ]),
  );

  // Get user details for grade calculation
  const allUsers = await prisma.user.findMany({
    where: {
      id: { in: allUserIds },
    },
    select: {
      id: true,
      birthday: true,
    },
  });

  // Calculate total scores for all users with grades
  const userScores = allUsers.map((u) => {
    const totalScore = (arScoreMap.get(u.id) || 0) + (rcScoreMap.get(u.id) || 0);
    return {
      id: u.id,
      score: totalScore,
      grade: calculateGrade(u.birthday),
    };
  });

  // Filter out users with zero scores for ranking
  const activeUsers = userScores.filter((u) => u.score > 0);

  // If user has no monthly score, they're not ranked
  if (userTotalScore === 0) {
    const userGrade = calculateGrade(user.birthday);
    return {
      overallRankingPercentage: "Unranked",
      gradeRankingPercentage: "Unranked",
      totalUsers: activeUsers.length,
      usersInGrade: activeUsers.filter((u) => u.grade === userGrade).length,
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
