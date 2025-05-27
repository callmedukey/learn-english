import { NextRequest, NextResponse } from "next/server";

import { getUserRanking } from "@/components/leaderboard/queries/user-ranking.query";
import { getUserStats } from "@/components/leaderboard/queries/user-stats.query";

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

    const [userStats, userRanking] = await Promise.all([
      getUserStats(userId),
      getUserRanking(userId),
    ]);

    if (!userStats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...userStats,
      ranking: userRanking,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
