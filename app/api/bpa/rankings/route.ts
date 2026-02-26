import { NextRequest, NextResponse } from "next/server";

import calculateGrade from "@/lib/utils/calculate-grade";
import { BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

/**
 * GET /api/bpa/rankings?timeframeId=xxx&season=SPRING&levelId=xxx
 * Fetch BPA rankings for a specific timeframe, season, and level
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframeId = searchParams.get("timeframeId");
    const season = searchParams.get("season") as "Spring" | "Summer" | "Fall" | "Winter";
    const levelId = searchParams.get("levelId");

    if (!timeframeId || !season || !levelId) {
      return NextResponse.json(
        { error: "Missing required parameters: timeframeId, season, levelId" },
        { status: 400 }
      );
    }

    // Convert frontend season format to BPASeason enum
    let bpaSeason: BPASeason;
    switch (season) {
      case "Spring":
        bpaSeason = BPASeason.SPRING;
        break;
      case "Summer":
        bpaSeason = BPASeason.SUMMER;
        break;
      case "Fall":
        bpaSeason = BPASeason.FALL;
        break;
      case "Winter":
        bpaSeason = BPASeason.WINTER;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid season parameter" },
          { status: 400 }
        );
    }

    // Get today's date range for today's scores
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

    // Fetch BPA scores ordered by score (highest first)
    const bpaScores = await prisma.bPAScore.findMany({
      where: {
        timeframeId: timeframeId,
        season: bpaSeason,
        bpaLevelId: levelId,
      },
      orderBy: {
        score: "desc",
      },
      // No limit - show all students
    });

    // Get all user IDs for batch query
    const userIds = bpaScores.map((s) => s.userId);

    // Fetch today's BPA completions for all users in one query
    const todayCompletions = await prisma.bPAQuestionCompleted.findMany({
      where: {
        userId: { in: userIds },
        createdAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
      select: {
        userId: true,
        score: true,
      },
    });

    // Aggregate today's scores by user
    const todayScoresByUser = new Map<string, number>();
    for (const completion of todayCompletions) {
      const existing = todayScoresByUser.get(completion.userId) || 0;
      todayScoresByUser.set(completion.userId, existing + completion.score);
    }

    // Fetch user details separately for each score
    const rankings = await Promise.all(
      bpaScores.map(async (scoreRecord, index) => {
        const user = await prisma.user.findUnique({
          where: { id: scoreRecord.userId },
          select: {
            id: true,
            nickname: true,
            birthday: true,
            campusId: true,
            campus: {
              select: {
                name: true,
              },
            },
          },
        });

        return {
          id: scoreRecord.userId,
          rank: index + 1,
          nickname: user?.nickname || "Anonymous",
          grade: calculateGrade(user?.birthday || null),
          score: scoreRecord.score,
          todayScore: todayScoresByUser.get(scoreRecord.userId) || 0,
          campusId: user?.campusId || null,
          campusName: user?.campus?.name,
        };
      })
    );

    return NextResponse.json({ rankings });
  } catch (error) {
    console.error("Error fetching BPA rankings:", error);
    return NextResponse.json(
      { error: "Failed to fetch BPA rankings" },
      { status: 500 }
    );
  }
}
