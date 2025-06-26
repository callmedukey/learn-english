import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the challenge with all related data
    const challenge = await prisma.monthlyChallenge.findUnique({
      where: { id },
      include: {
        leaderboard: {
          include: {
            goldUser: {
              select: { id: true, nickname: true, image: true },
            },
            silverUser: {
              select: { id: true, nickname: true, image: true },
            },
            bronzeUser: {
              select: { id: true, nickname: true, image: true },
            },
          },
        },
        medals: {
          include: {
            user: {
              select: { id: true, nickname: true },
            },
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 },
      );
    }

    // Fetch content details (novels or keywords)
    let content: Array<{ id: string; title?: string; name?: string }> = [];
    let levelInfo = null;
    let topScores: any[] = [];

    if (challenge.levelType === "AR") {
      // Fetch AR level info
      levelInfo = await prisma.aR.findUnique({
        where: { id: challenge.levelId },
        select: { id: true, level: true, score: true },
      });

      // Fetch novel details
      if (challenge.novelIds.length > 0) {
        const novels = await prisma.novel.findMany({
          where: { id: { in: challenge.novelIds } },
          select: { id: true, title: true },
          orderBy: { title: "asc" },
        });
        content = novels;
      }

      // Fetch top scores if not finalized
      if (!challenge.leaderboard?.finalized) {
        topScores = await prisma.monthlyARScore.findMany({
          where: {
            ARId: challenge.levelId,
            year: challenge.year,
            month: challenge.month,
            challengeId: challenge.id,
          },
          orderBy: { score: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                image: true,
              },
            },
          },
        });
      }
    } else {
      // Fetch RC level info
      levelInfo = await prisma.rCLevel.findUnique({
        where: { id: challenge.levelId },
        select: { id: true, level: true },
      });

      // Fetch keyword details
      if (challenge.keywordIds.length > 0) {
        const keywords = await prisma.rCKeyword.findMany({
          where: { id: { in: challenge.keywordIds } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        content = keywords;
      }

      // Fetch top scores if not finalized
      if (!challenge.leaderboard?.finalized) {
        topScores = await prisma.monthlyRCScore.findMany({
          where: {
            RCLevelId: challenge.levelId,
            year: challenge.year,
            month: challenge.month,
            challengeId: challenge.id,
          },
          orderBy: { score: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                image: true,
              },
            },
          },
        });
      }
    }

    // Group medals by type
    const medalsByType = challenge.medals.reduce(
      (acc, medal) => {
        if (!acc[medal.medalType]) {
          acc[medal.medalType] = [];
        }
        acc[medal.medalType].push(medal);
        return acc;
      },
      {} as Record<string, typeof challenge.medals>,
    );

    return NextResponse.json({
      challenge,
      content,
      levelInfo,
      leaderboard: challenge.leaderboard,
      medalWinners: medalsByType,
      topScores,
    });
  } catch (error) {
    console.error("Failed to fetch challenge details:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenge details" },
      { status: 500 },
    );
  }
}
