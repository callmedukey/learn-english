"server only";

import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/shared/constants/timezone";
import { prisma } from "@/prisma/prisma-client";

export interface UserTodayStats {
  novelScore: number;
  rcScore: number;
  totalScore: number;
}

export async function getUserTodayStats(
  userId: string
): Promise<UserTodayStats> {
  // Get current time in Korean timezone
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);

  // Get start and end of today in Korean timezone, then convert to UTC for DB query
  const todayStartKorea = startOfDay(koreaTime);
  const todayEndKorea = endOfDay(koreaTime);

  const todayStartUTC = fromZonedTime(todayStartKorea, APP_TIMEZONE);
  const todayEndUTC = fromZonedTime(todayEndKorea, APP_TIMEZONE);

  // Query ScoreTransaction for today's scores
  const todayTransactions = await prisma.scoreTransaction.findMany({
    where: {
      userId,
      createdAt: {
        gte: todayStartUTC,
        lte: todayEndUTC,
      },
    },
    select: {
      score: true,
      source: true,
    },
  });

  // Sum up scores by source
  let novelScore = 0; // Novel + BPA
  let rcScore = 0;

  for (const tx of todayTransactions) {
    if (tx.source === "Novel" || tx.source === "BPA") {
      novelScore += tx.score;
    } else if (tx.source === "RC") {
      rcScore += tx.score;
    }
  }

  return {
    novelScore,
    rcScore,
    totalScore: novelScore + rcScore,
  };
}
