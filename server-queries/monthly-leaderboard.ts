import "server-only";

import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { prisma } from "@/prisma/prisma-client";
import { LevelType } from "@/prisma/generated/prisma";

interface MonthlyStats {
  userId: string;
  score: number;
  userName: string;
  userEmail: string;
}

export async function getMonthlyLeaderboard(
  levelType: LevelType,
  levelId: string,
  limit: number = 10
) {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  if (levelType === "AR") {
    const scores = await prisma.monthlyARScore.findMany({
      where: {
        ARId: levelId,
        year,
        month,
        score: { gt: 0 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        score: "desc",
      },
      take: limit,
    });

    return scores.map((s) => ({
      userId: s.userId,
      score: s.score,
      userName: s.user.name || "Anonymous",
      userEmail: s.user.email || "",
    }));
  } else {
    const scores = await prisma.monthlyRCScore.findMany({
      where: {
        RCLevelId: levelId,
        year,
        month,
        score: { gt: 0 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        score: "desc",
      },
      take: limit,
    });

    return scores.map((s) => ({
      userId: s.userId,
      score: s.score,
      userName: s.user.name || "Anonymous",
      userEmail: s.user.email || "",
    }));
  }
}

export async function getUserMonthlyStats(
  userId: string,
  levelType: LevelType,
  levelId: string
) {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  if (levelType === "AR") {
    const stats = await prisma.monthlyARScore.findUnique({
      where: {
        userId_ARId_year_month: {
          userId,
          ARId: levelId,
          year,
          month,
        },
      },
    });

    return {
      score: stats?.score || 0,
      year,
      month,
    };
  } else {
    const stats = await prisma.monthlyRCScore.findUnique({
      where: {
        userId_RCLevelId_year_month: {
          userId,
          RCLevelId: levelId,
          year,
          month,
        },
      },
    });

    return {
      score: stats?.score || 0,
      year,
      month,
    };
  }
}

export async function getMonthlyLeaderboardByGrade(
  grade: string,
  limit: number = 10
) {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  // Get AR levels for this grade
  const arLevels = await prisma.aR.findMany({
    where: {
      relevantGrade: {
        contains: grade,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  // Get RC levels for this grade
  const rcLevels = await prisma.rCLevel.findMany({
    where: {
      relevantGrade: {
        contains: grade,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  // Get BPA levels for this grade
  const bpaLevels = await prisma.bPALevel.findMany({
    select: {
      id: true,
    },
  });

  const arLevelIds = arLevels.map((l) => l.id);
  const rcLevelIds = rcLevels.map((l) => l.id);
  const bpaLevelIds = bpaLevels.map((l) => l.id);

  // Get AR scores
  const arScores = await prisma.monthlyARScore.groupBy({
    by: ["userId"],
    where: {
      ARId: { in: arLevelIds },
      year,
      month,
    },
    _sum: {
      score: true,
    },
  });

  // Get RC scores
  const rcScores = await prisma.monthlyRCScore.groupBy({
    by: ["userId"],
    where: {
      RCLevelId: { in: rcLevelIds },
      year,
      month,
    },
    _sum: {
      score: true,
    },
  });

  // Get BPA scores
  const bpaScores = await prisma.monthlyBPAScore.groupBy({
    by: ["userId"],
    where: {
      bpaLevelId: { in: bpaLevelIds },
      year,
      month,
    },
    _sum: {
      score: true,
    },
  });

  // Combine scores
  const userScores = new Map<string, number>();

  arScores.forEach((s) => {
    userScores.set(s.userId, (s._sum.score || 0));
  });

  rcScores.forEach((s) => {
    const currentScore = userScores.get(s.userId) || 0;
    userScores.set(s.userId, currentScore + (s._sum.score || 0));
  });

  bpaScores.forEach((s) => {
    const currentScore = userScores.get(s.userId) || 0;
    userScores.set(s.userId, currentScore + (s._sum.score || 0));
  });

  // Convert to array and sort
  const sortedScores = Array.from(userScores.entries())
    .map(([userId, score]) => ({ userId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Get user details
  const users = await prisma.user.findMany({
    where: {
      id: { in: sortedScores.map((s) => s.userId) },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return sortedScores.map((s) => {
    const user = userMap.get(s.userId);
    return {
      userId: s.userId,
      score: s.score,
      userName: user?.name || "Anonymous",
      userEmail: user?.email || "",
    };
  });
}

export async function getMonthlyOverallLeaderboard(limit: number = 10) {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  // Get all AR scores
  const arScores = await prisma.monthlyARScore.groupBy({
    by: ["userId"],
    where: {
      year,
      month,
    },
    _sum: {
      score: true,
    },
  });

  // Get all RC scores
  const rcScores = await prisma.monthlyRCScore.groupBy({
    by: ["userId"],
    where: {
      year,
      month,
    },
    _sum: {
      score: true,
    },
  });

  // Get all BPA scores
  const bpaScores = await prisma.monthlyBPAScore.groupBy({
    by: ["userId"],
    where: {
      year,
      month,
    },
    _sum: {
      score: true,
    },
  });

  // Combine scores
  const userScores = new Map<string, number>();

  arScores.forEach((s) => {
    userScores.set(s.userId, (s._sum.score || 0));
  });

  rcScores.forEach((s) => {
    const currentScore = userScores.get(s.userId) || 0;
    userScores.set(s.userId, currentScore + (s._sum.score || 0));
  });

  bpaScores.forEach((s) => {
    const currentScore = userScores.get(s.userId) || 0;
    userScores.set(s.userId, currentScore + (s._sum.score || 0));
  });

  // Convert to array and sort
  const sortedScores = Array.from(userScores.entries())
    .map(([userId, score]) => ({ userId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Get user details
  const users = await prisma.user.findMany({
    where: {
      id: { in: sortedScores.map((s) => s.userId) },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return sortedScores.map((s) => {
    const user = userMap.get(s.userId);
    return {
      userId: s.userId,
      score: s.score,
      userName: user?.name || "Anonymous",
      userEmail: user?.email || "",
    };
  });
}