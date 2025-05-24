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
