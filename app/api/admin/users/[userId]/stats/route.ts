import { endOfDay, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { NextRequest, NextResponse } from "next/server";

import { APP_TIMEZONE } from "@/lib/shared/constants/timezone";
import { prisma } from "@/prisma/prisma-client";

export const dynamic = "force-dynamic";

interface UserStatsResponse {
  allTime: {
    novelScore: number;
    rcScore: number;
    totalScore: number;
  };
  monthly: {
    novelScore: number;
    rcScore: number;
    totalScore: number;
  };
  today: {
    novelScore: number;
    rcScore: number;
    totalScore: number;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<UserStatsResponse | { error: string }>> {
  try {
    const { userId } = await params;

    // Get current time in Korean timezone
    const now = new Date();
    const koreaTime = toZonedTime(now, APP_TIMEZONE);
    const year = koreaTime.getFullYear();
    const month = koreaTime.getMonth() + 1;

    // Get start and end of today in Korean timezone, then convert to UTC for DB query
    const todayStartKorea = startOfDay(koreaTime);
    const todayEndKorea = endOfDay(koreaTime);
    const todayStartUTC = fromZonedTime(todayStartKorea, APP_TIMEZONE);
    const todayEndUTC = fromZonedTime(todayEndKorea, APP_TIMEZONE);

    // Fetch all stats in parallel
    const [
      allTimeAR,
      allTimeRC,
      allTimeBPA,
      monthlyAR,
      monthlyRC,
      monthlyBPA,
      todayTransactions,
    ] = await Promise.all([
      // All-time scores
      prisma.aRScore.aggregate({
        where: { userId },
        _sum: { score: true },
      }),
      prisma.rCScore.aggregate({
        where: { userId },
        _sum: { score: true },
      }),
      prisma.bPAScore.aggregate({
        where: { userId },
        _sum: { score: true },
      }),
      // Monthly scores
      prisma.monthlyARScore.aggregate({
        where: { userId, year, month },
        _sum: { score: true },
      }),
      prisma.monthlyRCScore.aggregate({
        where: { userId, year, month },
        _sum: { score: true },
      }),
      prisma.monthlyBPAScore.aggregate({
        where: { userId, year, month },
        _sum: { score: true },
      }),
      // Today's transactions
      prisma.scoreTransaction.findMany({
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
      }),
    ]);

    // Calculate all-time scores
    const allTimeArScore = allTimeAR._sum.score || 0;
    const allTimeBpaScore = allTimeBPA._sum.score || 0;
    const allTimeNovelScore = allTimeArScore + allTimeBpaScore;
    const allTimeRcScore = allTimeRC._sum.score || 0;

    // Calculate monthly scores
    const monthlyArScore = monthlyAR._sum.score || 0;
    const monthlyBpaScore = monthlyBPA._sum.score || 0;
    const monthlyNovelScore = monthlyArScore + monthlyBpaScore;
    const monthlyRcScore = monthlyRC._sum.score || 0;

    // Calculate today's scores
    let todayNovelScore = 0;
    let todayRcScore = 0;
    for (const tx of todayTransactions) {
      if (tx.source === "Novel" || tx.source === "BPA") {
        todayNovelScore += tx.score;
      } else if (tx.source === "RC") {
        todayRcScore += tx.score;
      }
    }

    return NextResponse.json({
      allTime: {
        novelScore: allTimeNovelScore,
        rcScore: allTimeRcScore,
        totalScore: allTimeNovelScore + allTimeRcScore,
      },
      monthly: {
        novelScore: monthlyNovelScore,
        rcScore: monthlyRcScore,
        totalScore: monthlyNovelScore + monthlyRcScore,
      },
      today: {
        novelScore: todayNovelScore,
        rcScore: todayRcScore,
        totalScore: todayNovelScore + todayRcScore,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
