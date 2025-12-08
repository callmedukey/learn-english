import React, { Suspense } from "react";

import { auth } from "@/auth";

import CampusLeaderboardClient from "./components/campus-leaderboard-client";
import LeaderboardClient from "./components/leaderboard-client";
import LeaderboardStats from "./components/leaderboard-stats";
import {
  CampusLeaderboardFilters,
  getBPALevels,
  getBPATimeframes,
  getCampusLeaderboardData,
  getCampuses,
  PaginationParams as CampusPaginationParams,
} from "./queries/campus-leaderboard.query";
import {
  getCountries,
  getGradeLeaderboardData,
  getLeaderboardData,
  getMonthlyLeaderboardData,
  LeaderboardFilters,
  PaginationParams,
} from "./queries/leaderboard.query";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    country?: string;
    campus?: string;
    grade?: string;
    totalScoreMin?: string;
    totalScoreMax?: string;
    novelScoreMin?: string;
    novelScoreMax?: string;
    rcScoreMin?: string;
    rcScoreMax?: string;
    allTimePage?: string;
    allTimePageSize?: string;
    monthlyPage?: string;
    monthlyPageSize?: string;
    gradeTabGrade?: string;
    gradeTabPage?: string;
    gradeTabPageSize?: string;
    // Campus leaderboard params
    timeframeId?: string;
    semesterId?: string;
    campusId?: string;
    bpaLevelId?: string;
    unitId?: string;
    campusPage?: string;
    campusPageSize?: string;
  }>;
}

async function LeaderboardData({ searchParams }: PageProps) {
  const params = await searchParams;

  // Get current user's session to check role
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  // Parse filters from search params
  const filters: LeaderboardFilters = {
    searchQuery: params.search || undefined,
    countryId: params.country || undefined,
    campusId: params.campus || undefined,
    grade: params.grade || undefined,
    totalScoreMin: params.totalScoreMin
      ? Number(params.totalScoreMin)
      : undefined,
    totalScoreMax: params.totalScoreMax
      ? Number(params.totalScoreMax)
      : undefined,
    novelScoreMin: params.novelScoreMin
      ? Number(params.novelScoreMin)
      : undefined,
    novelScoreMax: params.novelScoreMax
      ? Number(params.novelScoreMax)
      : undefined,
    rcScoreMin: params.rcScoreMin ? Number(params.rcScoreMin) : undefined,
    rcScoreMax: params.rcScoreMax ? Number(params.rcScoreMax) : undefined,
  };

  // Parse pagination params
  const allTimePagination: PaginationParams = {
    page: Number(params.allTimePage) || 1,
    pageSize: Number(params.allTimePageSize) || 50,
  };

  const monthlyPagination: PaginationParams = {
    page: Number(params.monthlyPage) || 1,
    pageSize: Number(params.monthlyPageSize) || 50,
  };

  const gradeTabGrade = params.gradeTabGrade || "Grade 1";
  const gradeTabPagination: PaginationParams = {
    page: Number(params.gradeTabPage) || 1,
    pageSize: Number(params.gradeTabPageSize) || 100,
  };

  // Parse campus leaderboard filters
  const campusFilters: CampusLeaderboardFilters = {
    timeframeId: params.timeframeId || undefined,
    semesterId: params.semesterId || undefined,
    campusId: params.campusId || undefined,
    bpaLevelId: params.bpaLevelId || undefined,
    unitId: params.unitId || undefined,
  };

  const campusPagination: CampusPaginationParams = {
    page: Number(params.campusPage) || 1,
    pageSize: Number(params.campusPageSize) || 20,
  };

  // Fetch data with filters and pagination
  const [
    allTimeData,
    monthlyData,
    gradeData,
    countries,
    campuses,
    campusLeaderboardData,
    timeframes,
    bpaLevels,
  ] = await Promise.all([
    getLeaderboardData(filters, allTimePagination),
    getMonthlyLeaderboardData(filters, monthlyPagination),
    getGradeLeaderboardData(gradeTabGrade, filters, gradeTabPagination),
    getCountries(),
    getCampuses(),
    getCampusLeaderboardData(campusFilters, campusPagination),
    getBPATimeframes(),
    getBPALevels(),
  ]);

  return (
    <div className="space-y-12">
      {isAdmin && (
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">User Stats</h2>
          <LeaderboardStats totalUsers={allTimeData.total} stats={allTimeData.stats} />
        </div>
      )}

      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">User Leaderboard</h2>
        <LeaderboardClient
          initialAllTimeData={allTimeData}
          initialMonthlyData={monthlyData}
          initialGradeData={gradeData}
          countries={countries}
          campuses={campuses}
        />
      </div>

      <div className="border-t border-gray-300 pt-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Campus Leaderboard</h2>
        <CampusLeaderboardClient
          initialData={campusLeaderboardData}
          timeframes={timeframes}
          campuses={campuses}
          bpaLevels={bpaLevels}
        />
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
}

export default async function Page({ searchParams }: PageProps) {
  return (
    <div className="px-1">
      <div className="mb-8">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Monitor user performance and engagement across countries and grades
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <LeaderboardData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
