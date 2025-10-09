import React, { Suspense } from "react";

import { prisma } from "@/prisma/prisma-client";

import LeaderboardClient from "./components/leaderboard-client";
import LeaderboardStats from "./components/leaderboard-stats";
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
    lexileScoreMin?: string;
    lexileScoreMax?: string;
    rcScoreMin?: string;
    rcScoreMax?: string;
    allTimePage?: string;
    allTimePageSize?: string;
    monthlyPage?: string;
    monthlyPageSize?: string;
    gradeTabGrade?: string;
    gradeTabPage?: string;
    gradeTabPageSize?: string;
  }>;
}

async function LeaderboardData({ searchParams }: PageProps) {
  const params = await searchParams;

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
    lexileScoreMin: params.lexileScoreMin
      ? Number(params.lexileScoreMin)
      : undefined,
    lexileScoreMax: params.lexileScoreMax
      ? Number(params.lexileScoreMax)
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

  // Fetch data with filters and pagination
  const [allTimeData, monthlyData, gradeData, countries, campuses] = await Promise.all([
    getLeaderboardData(filters, allTimePagination),
    getMonthlyLeaderboardData(filters, monthlyPagination),
    getGradeLeaderboardData(gradeTabGrade, filters, gradeTabPagination),
    getCountries(),
    prisma.campus.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <LeaderboardStats totalUsers={allTimeData.total} stats={allTimeData.stats} />
      <LeaderboardClient
        initialAllTimeData={allTimeData}
        initialMonthlyData={monthlyData}
        initialGradeData={gradeData}
        countries={countries}
        campuses={campuses}
      />
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
