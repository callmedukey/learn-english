"server only";

import { prisma } from "@/prisma/prisma-client";

export interface CampusLeaderboardFilters {
  timeframeId?: string;
  semesterId?: string;
  campusId?: string;
  bpaLevelId?: string;
  unitId?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CampusRanking {
  id: string;
  name: string;
  studentCount: number;
  totalScore: number;
  rank: number;
}

export interface CampusLeaderboardResult {
  campuses: CampusRanking[];
  total: number;
  totalPages: number;
}

/**
 * Get campus leaderboard data with filtering and pagination
 */
export async function getCampusLeaderboardData(
  filters: CampusLeaderboardFilters,
  pagination: PaginationParams
): Promise<CampusLeaderboardResult> {
  // Build where clause for BPA scores
  const scoreWhere: any = {};

  if (filters.semesterId) {
    scoreWhere.semesterId = filters.semesterId;
  } else if (filters.timeframeId) {
    // If no semester specified, use timeframe
    scoreWhere.timeframeId = filters.timeframeId;
  }

  if (filters.bpaLevelId) {
    scoreWhere.bpaLevelId = filters.bpaLevelId;
  }

  // Fetch all users with their campus and BPA scores
  const users = await prisma.user.findMany({
    where: {
      campusId: { not: null },
      ...(filters.campusId ? { campusId: filters.campusId } : {}),
      bpaScores: {
        some: scoreWhere,
      },
    },
    include: {
      campus: true,
      bpaScores: {
        where: scoreWhere,
        ...(filters.unitId
          ? {
              include: {
                questionsCompleted: {
                  include: {
                    question: {
                      include: {
                        questionSet: {
                          include: {
                            chapter: {
                              include: {
                                unit: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }
          : {}),
      },
    },
  });

  // Filter by unit if specified
  let filteredUsers = users;
  if (filters.unitId) {
    filteredUsers = users.filter((user) => {
      return user.bpaScores.some((score: any) =>
        score.questionsCompleted?.some(
          (q: any) => q.question?.questionSet?.chapter?.unitId === filters.unitId
        )
      );
    });
  }

  // Aggregate by campus
  const campusMap = new Map<string, {
    campus: { id: string; name: string };
    studentCount: number;
    totalScore: number;
  }>();

  for (const user of filteredUsers) {
    if (!user.campus) continue;

    const campusId = user.campus.id;
    const userScore = user.bpaScores.reduce((sum, score) => sum + score.score, 0);

    if (!campusMap.has(campusId)) {
      campusMap.set(campusId, {
        campus: { id: user.campus.id, name: user.campus.name },
        studentCount: 0,
        totalScore: 0,
      });
    }

    const campusData = campusMap.get(campusId)!;
    campusData.studentCount += 1;
    campusData.totalScore += userScore;
  }

  // Convert to array and calculate ranks
  const campusArray = Array.from(campusMap.values())
    .map((campus) => ({
      id: campus.campus.id,
      name: campus.campus.name,
      studentCount: campus.studentCount,
      totalScore: campus.totalScore,
      rank: 0, // Will be set below
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks
  campusArray.forEach((campus, index) => {
    campus.rank = index + 1;
  });

  // Apply pagination
  const total = campusArray.length;
  const totalPages = Math.ceil(total / pagination.pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const paginatedCampuses = campusArray.slice(
    startIndex,
    startIndex + pagination.pageSize
  );

  return {
    campuses: paginatedCampuses,
    total,
    totalPages,
  };
}

/**
 * Get all campuses for filter dropdown
 */
export async function getCampuses() {
  return await prisma.campus.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Get BPA timeframes with semesters
 */
export async function getBPATimeframes() {
  return await prisma.bPATimeframe.findMany({
    include: {
      semesters: {
        orderBy: {
          startDate: "asc",
        },
      },
    },
    orderBy: [
      {
        year: "desc",
      },
      {
        startDate: "desc",
      },
    ],
  });
}

/**
 * Get BPA levels for filtering
 */
export async function getBPALevels() {
  return await prisma.bPALevel.findMany({
    select: {
      id: true,
      name: true,
      orderNumber: true,
    },
    orderBy: {
      orderNumber: "asc",
    },
  });
}

/**
 * Get BPA units for a specific level
 */
export async function getBPAUnitsForLevel(levelId: string) {
  return await prisma.bPAUnit.findMany({
    where: {
      novel: {
        bpaLevelId: levelId,
      },
    },
    select: {
      id: true,
      name: true,
      orderNumber: true,
    },
    orderBy: {
      orderNumber: "asc",
    },
    distinct: ["name"],
  });
}
