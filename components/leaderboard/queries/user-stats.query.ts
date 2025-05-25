"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface UserStatsData {
  id: string;
  nickname: string;
  grade: string;
  arStats: {
    level: string;
    score: number;
    count: number;
  }[];
  rcStats: {
    level: string;
    score: number;
    count: number;
  }[];
  totalArScore: number;
  totalRcScore: number;
}

export async function getUserStats(
  userId: string,
): Promise<UserStatsData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ARScore: {
        include: {
          AR: true,
        },
      },
      RCScore: {
        include: {
          RCLevel: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const grade = calculateGrade(user.birthday);

  // Group AR scores by level
  const arStatsMap = new Map<string, { score: number; count: number }>();
  user.ARScore.forEach((arScore) => {
    const level = arScore.AR.level;
    const existing = arStatsMap.get(level) || { score: 0, count: 0 };
    arStatsMap.set(level, {
      score: existing.score + arScore.score,
      count: existing.count + 1,
    });
  });

  // Group RC scores by level
  const rcStatsMap = new Map<string, { score: number; count: number }>();
  user.RCScore.forEach((rcScore) => {
    const level = rcScore.RCLevel.level;
    const existing = rcStatsMap.get(level) || { score: 0, count: 0 };
    rcStatsMap.set(level, {
      score: existing.score + rcScore.score,
      count: existing.count + 1,
    });
  });

  // Convert to arrays and sort
  const arStats = Array.from(arStatsMap.entries())
    .map(([level, data]) => ({
      level,
      score: data.score,
      count: data.count,
    }))
    .sort((a, b) => a.level.localeCompare(b.level));

  const rcStats = Array.from(rcStatsMap.entries())
    .map(([level, data]) => ({
      level,
      score: data.score,
      count: data.count,
    }))
    .sort((a, b) => a.level.localeCompare(b.level));

  const totalArScore = user.ARScore.reduce(
    (sum, score) => sum + score.score,
    0,
  );
  const totalRcScore = user.RCScore.reduce(
    (sum, score) => sum + score.score,
    0,
  );

  return {
    id: user.id,
    nickname: user.nickname || user.name || "Anonymous",
    grade,
    arStats,
    rcStats,
    totalArScore,
    totalRcScore,
  };
}
