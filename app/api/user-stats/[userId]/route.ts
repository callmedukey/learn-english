import { NextRequest, NextResponse } from "next/server";

import { getUserRanking } from "@/components/leaderboard/queries/user-ranking.query";
import { getUserStats } from "@/components/leaderboard/queries/user-stats.query";
import { getUserMedalCounts, getUserMedalImages, getUserMedalDetails, getUserMedalsByLevel } from "@/server-queries/user-medals";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const [userStats, userRanking, medalCounts, medalImages, recentMedals, medalsByLevel] = await Promise.all([
      getUserStats(userId),
      getUserRanking(userId),
      getUserMedalCounts(userId),
      getUserMedalImages(userId),
      getUserMedalDetails(userId),
      getUserMedalsByLevel(userId),
    ]);

    if (!userStats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...userStats,
      ranking: userRanking,
      medals: {
        ...medalCounts,
        images: medalImages,
        recent: recentMedals,
        medalsByLevel: medalsByLevel,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
