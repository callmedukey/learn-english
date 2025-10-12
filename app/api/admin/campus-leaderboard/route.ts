import { NextRequest, NextResponse } from "next/server";

import {
  CampusLeaderboardFilters,
  getCampusLeaderboardData,
  PaginationParams,
} from "@/app/(after-auth)/admin/queries/campus-leaderboard.query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters: CampusLeaderboardFilters = {
      timeframeId: searchParams.get("timeframeId") || undefined,
      semesterId: searchParams.get("semesterId") || undefined,
      campusId: searchParams.get("campusId") || undefined,
      bpaLevelId: searchParams.get("bpaLevelId") || undefined,
      unitId: searchParams.get("unitId") || undefined,
    };

    // Parse pagination
    const pagination: PaginationParams = {
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 20,
    };

    // Fetch campus leaderboard data
    const data = await getCampusLeaderboardData(filters, pagination);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching campus leaderboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch campus leaderboard data" },
      { status: 500 }
    );
  }
}
