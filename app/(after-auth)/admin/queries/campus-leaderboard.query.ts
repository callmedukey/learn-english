"server only";

import { prisma } from "@/prisma/prisma-client";

export interface CampusLeaderboardFilters {
  timeframeId?: string;
  semesterId?: string;
  campusId?: string;
  bpaLevelId?: string;
  unitId?: string;
  grade?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CampusStudent {
  id: string;
  nickname: string | null;
  studentName: string | null;
  email: string;
  grade: string;
  campus: {
    id: string;
    name: string;
  };
  bpaScore: number;
  rank: number;
}

export interface CampusLeaderboardResult {
  students: CampusStudent[];
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
  // Get semester details if semesterId is provided (for backward compatibility)
  let semesterInfo: { timeframeId: string; season: string } | null = null;
  if (filters.semesterId) {
    const semester = await prisma.bPASemester.findUnique({
      where: { id: filters.semesterId },
      select: { timeframeId: true, season: true },
    });
    if (semester) {
      semesterInfo = semester;
    }
  }

  // Build where clause for BPA scores (supports both old and new schema)
  const scoreWhere: any = {};

  if (filters.semesterId && semesterInfo) {
    // For backward compatibility: match either semesterId OR (timeframeId + season)
    scoreWhere.OR = [
      { semesterId: filters.semesterId },
      {
        AND: [
          { semesterId: null },
          { timeframeId: semesterInfo.timeframeId },
          { season: semesterInfo.season },
        ],
      },
    ];
  } else if (filters.timeframeId) {
    // If no semester specified, use timeframe only
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

  // Map users to CampusStudent objects
  const students: CampusStudent[] = filteredUsers.map((user) => {
    const bpaScore = user.bpaScores.reduce((sum, score) => sum + score.score, 0);

    // Calculate grade based on birthday
    const calculateGrade = (birthday: Date | null): string => {
      if (!birthday) return "N/A";
      const today = new Date();
      const birthDate = new Date(birthday);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age >= 20) return "Adult";
      if (age < 6) return "Kinder";
      const grade = age - 5;
      return `Grade ${grade}`;
    };

    return {
      id: user.id,
      nickname: user.nickname,
      studentName: user.studentName,
      email: user.email,
      grade: calculateGrade(user.birthday),
      campus: {
        id: user.campus!.id,
        name: user.campus!.name,
      },
      bpaScore,
      rank: 0, // Will be assigned after sorting
    };
  });

  // Filter by grade if specified
  const gradeFilteredStudents = filters.grade
    ? students.filter((student) => student.grade === filters.grade)
    : students;

  // Sort students by BPA score (descending)
  const sortedStudents = gradeFilteredStudents.sort((a, b) => b.bpaScore - a.bpaScore);

  // Assign ranks based on score
  sortedStudents.forEach((student, index) => {
    student.rank = index + 1;
  });

  // Apply pagination
  const total = sortedStudents.length;
  const totalPages = Math.ceil(total / pagination.pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const paginatedStudents = sortedStudents.slice(
    startIndex,
    startIndex + pagination.pageSize
  );

  return {
    students: paginatedStudents,
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
