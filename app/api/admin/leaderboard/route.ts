import { NextRequest, NextResponse } from "next/server";

import {
  getGradeLeaderboardData,
  getLeaderboardData,
  getMonthlyLeaderboardData,
  LeaderboardFilters,
  PaginationParams,
} from "@/app/(after-auth)/admin/queries/leaderboard.query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters: LeaderboardFilters = {
      searchQuery: searchParams.get("search") || undefined,
      countryId: searchParams.get("country") || undefined,
      campusId: searchParams.get("campus") || undefined,
      grade: searchParams.get("grade") || undefined,
      totalScoreMin: searchParams.get("totalScoreMin")
        ? Number(searchParams.get("totalScoreMin"))
        : undefined,
      totalScoreMax: searchParams.get("totalScoreMax")
        ? Number(searchParams.get("totalScoreMax"))
        : undefined,
      novelScoreMin: searchParams.get("novelScoreMin")
        ? Number(searchParams.get("novelScoreMin"))
        : undefined,
      novelScoreMax: searchParams.get("novelScoreMax")
        ? Number(searchParams.get("novelScoreMax"))
        : undefined,
      rcScoreMin: searchParams.get("rcScoreMin")
        ? Number(searchParams.get("rcScoreMin"))
        : undefined,
      rcScoreMax: searchParams.get("rcScoreMax")
        ? Number(searchParams.get("rcScoreMax"))
        : undefined,
    };

    // Parse all-time pagination
    const allTimePagination: PaginationParams = {
      page: Number(searchParams.get("allTimePage")) || 1,
      pageSize: Number(searchParams.get("allTimePageSize")) || 50,
    };

    // Parse monthly pagination
    const monthlyPagination: PaginationParams = {
      page: Number(searchParams.get("monthlyPage")) || 1,
      pageSize: Number(searchParams.get("monthlyPageSize")) || 50,
    };

    // Parse grade tab params
    const gradeTabGrade = searchParams.get("gradeTabGrade") || "Grade 1";
    const gradeTabPagination: PaginationParams = {
      page: Number(searchParams.get("gradeTabPage")) || 1,
      pageSize: Number(searchParams.get("gradeTabPageSize")) || 100,
    };

    // Fetch all datasets in parallel
    const [allTimeData, monthlyData, gradeData] = await Promise.all([
      getLeaderboardData(filters, allTimePagination),
      getMonthlyLeaderboardData(filters, monthlyPagination),
      getGradeLeaderboardData(gradeTabGrade, filters, gradeTabPagination),
    ]);

    return NextResponse.json({
      allTime: allTimeData,
      monthly: monthlyData,
      grade: gradeData,
    });
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}
