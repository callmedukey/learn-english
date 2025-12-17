import { NextRequest, NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import calculateGrade from "@/lib/utils/calculate-grade";
import { BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

/**
 * GET /api/mobile/bpa/rankings?timeframeId=xxx&season=Spring&levelId=xxx
 * Fetch BPA rankings for a specific timeframe, season, and level
 */
export async function GET(request: NextRequest) {
  try {
    // Verify mobile auth
    const payload = await verifyMobileToken(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeframeId = searchParams.get("timeframeId");
    const season = searchParams.get("season") as
      | "Spring"
      | "Summer"
      | "Fall"
      | "Winter";
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
    });

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
          campusId: user?.campusId || null,
          campusName: user?.campus?.name || null,
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
