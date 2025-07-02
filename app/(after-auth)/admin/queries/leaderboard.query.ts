"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface LeaderboardUser {
  id: string;
  nickname: string | null;
  name: string | null;
  email: string;
  birthday: Date | null;
  grade: string;
  country: {
    id: string;
    name: string;
  } | null;
  totalScore: number;
  arScores: number;
  rcScores: number;
}

export interface CountryOption {
  id: string;
  name: string;
}

export async function getLeaderboardData(
  countryId?: string,
): Promise<LeaderboardUser[]> {
  // First, get users with their total scores for efficient sorting
  const users = await prisma.user.findMany({
    where: countryId ? { countryId } : {},
    include: {
      country: {
        select: {
          id: true,
          name: true,
        },
      },
      score: true,
      ARScore: true,
      RCScore: true,
    },
    orderBy: {
      score: {
        score: "desc",
      },
    },
  });

  // Map and calculate additional scores
  const mappedUsers = users.map((user) => {
    const totalScore = user.score?.score || 0;
    const arScores = user.ARScore.reduce((sum, score) => sum + score.score, 0);
    const rcScores = user.RCScore.reduce((sum, score) => sum + score.score, 0);
    const grade = calculateGrade(user.birthday);

    return {
      id: user.id,
      nickname: user.nickname,
      name: user.name,
      email: user.email,
      birthday: user.birthday,
      grade,
      country: user.country,
      totalScore,
      arScores,
      rcScores,
    };
  });

  // Sort by total score (highest first), then by AR scores, then by RC scores, and take top 10
  return mappedUsers
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (b.arScores !== a.arScores) {
        return b.arScores - a.arScores;
      }
      return b.rcScores - a.rcScores;
    })
    .slice(0, 10);
}

export async function getCountries(): Promise<CountryOption[]> {
  const countries = await prisma.country.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return countries;
}

export async function getMonthlyLeaderboardData(
  countryId?: string,
  year?: number,
  month?: number,
): Promise<LeaderboardUser[]> {
  // Use current month/year if not provided
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1; // getMonth() returns 0-11

  // Get users with their monthly scores
  const users = await prisma.user.findMany({
    where: countryId ? { countryId } : {},
    include: {
      country: {
        select: {
          id: true,
          name: true,
        },
      },
      monthlyARScores: {
        where: {
          year: targetYear,
          month: targetMonth,
        },
      },
      monthlyRCScores: {
        where: {
          year: targetYear,
          month: targetMonth,
        },
      },
    },
  });

  // Map and calculate monthly scores
  const mappedUsers = users
    .map((user) => {
      const arScores = user.monthlyARScores.reduce((sum, score) => sum + score.score, 0);
      const rcScores = user.monthlyRCScores.reduce((sum, score) => sum + score.score, 0);
      const totalScore = arScores + rcScores;
      const grade = calculateGrade(user.birthday);

      return {
        id: user.id,
        nickname: user.nickname,
        name: user.name,
        email: user.email,
        birthday: user.birthday,
        grade,
        country: user.country,
        totalScore,
        arScores,
        rcScores,
      };
    })
    .filter(user => user.totalScore > 0); // Only include users with scores this month

  // Sort by total score (highest first), then by AR scores, then by RC scores, and take top 10
  return mappedUsers
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (b.arScores !== a.arScores) {
        return b.arScores - a.arScores;
      }
      return b.rcScores - a.rcScores;
    })
    .slice(0, 10);
}
