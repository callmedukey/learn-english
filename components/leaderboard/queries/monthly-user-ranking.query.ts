"server only";

import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface MonthlyOverallRankingUser {
  id: string;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  rank: number;
  medalImageUrl?: string;
}

// Helper function to extract just the number from grade
function formatGradeForDisplay(grade: string): string {
  if (grade.startsWith("Grade ")) {
    return grade.replace("Grade ", "");
  }
  if (grade === "Below Grade 1" || grade === "Kinder") {
    return "K";
  }
  return grade; // For "Adult" and "N/A"
}

export async function getMonthlyOverallRankings(
  type: "novel" | "rc",
): Promise<MonthlyOverallRankingUser[]> {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  if (type === "novel") {
    // Get top users with monthly AR scores across all levels
    const scores = await prisma.monthlyARScore.groupBy({
      by: ["userId"],
      where: {
        year,
        month,
      },
      _sum: {
        score: true,
      },
      orderBy: {
        _sum: {
          score: "desc",
        },
      },
      take: 5,
    });

    // Get user details for these top scorers
    const userIds = scores.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      include: {
        country: {
          include: {
            countryIcon: true,
          },
        },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return scores.map((score, index) => {
      const user = userMap.get(score.userId);
      const userGrade = user ? calculateGrade(user.birthday) : "N/A";
      
      return {
        id: score.userId,
        nickname: user?.nickname || user?.name || "Anonymous",
        grade: formatGradeForDisplay(userGrade),
        score: score._sum.score || 0,
        countryIcon: user?.country?.countryIcon?.iconUrl,
        rank: index + 1,
        medalImageUrl: undefined, // Placeholder
      };
    });
  } else {
    // Get top users with monthly RC scores across all levels
    const scores = await prisma.monthlyRCScore.groupBy({
      by: ["userId"],
      where: {
        year,
        month,
      },
      _sum: {
        score: true,
      },
      orderBy: {
        _sum: {
          score: "desc",
        },
      },
      take: 5,
    });

    // Get user details for these top scorers
    const userIds = scores.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      include: {
        country: {
          include: {
            countryIcon: true,
          },
        },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return scores.map((score, index) => {
      const user = userMap.get(score.userId);
      const userGrade = user ? calculateGrade(user.birthday) : "N/A";
      
      return {
        id: score.userId,
        nickname: user?.nickname || user?.name || "Anonymous",
        grade: formatGradeForDisplay(userGrade),
        score: score._sum.score || 0,
        countryIcon: user?.country?.countryIcon?.iconUrl,
        rank: index + 1,
        medalImageUrl: undefined, // Placeholder
      };
    });
  }
}

export async function getTotalMonthlyOverallRankings(): Promise<MonthlyOverallRankingUser[]> {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  // Get all users with either monthly AR or RC scores
  const [arScores, rcScores] = await Promise.all([
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
  const arScoreMap = new Map(arScores.map((s) => [s.userId, s._sum.score || 0]));
  const rcScoreMap = new Map(rcScores.map((s) => [s.userId, s._sum.score || 0]));
  
  // Get all unique user IDs
  const allUserIds = Array.from(new Set([
    ...arScores.map((s) => s.userId),
    ...rcScores.map((s) => s.userId),
  ]));

  // Calculate combined scores
  const combinedScores = allUserIds.map((userId) => ({
    userId,
    totalScore: (arScoreMap.get(userId) || 0) + (rcScoreMap.get(userId) || 0),
  }));

  // Sort and get top 5
  const topScores = combinedScores
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  // Get user details for these top scorers
  const userIds = topScores.map((s) => s.userId);
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    include: {
      country: {
        include: {
          countryIcon: true,
        },
      },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return topScores.map((score, index) => {
    const user = userMap.get(score.userId);
    const userGrade = user ? calculateGrade(user.birthday) : "N/A";
    
    return {
      id: score.userId,
      nickname: user?.nickname || user?.name || "Anonymous",
      grade: formatGradeForDisplay(userGrade),
      score: score.totalScore,
      countryIcon: user?.country?.countryIcon?.iconUrl,
      rank: index + 1,
      medalImageUrl: undefined, // Placeholder
    };
  });
}