"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface LeaderboardUser {
  id: string;
  nickname: string | null;
  name: string | null;
  email: string;
  birthday: Date | null;
  grade: string;
  country: {
    id: string;
    name: string;
  } | null;
  campus: {
    id: string;
    name: string;
  } | null;
  parentName: string | null;
  studentName: string | null;
  currentBPALevel: string | null;
  rank: number;
  totalScore: number;
  novelScores: number;
  rcScores: number;
}

export interface CountryOption {
  id: string;
  name: string;
}

export interface LeaderboardFilters {
  countryId?: string;
  campusId?: string;
  grade?: string;
  searchQuery?: string;
  totalScoreMin?: number;
  totalScoreMax?: number;
  novelScoreMin?: number;
  novelScoreMax?: number;
  rcScoreMin?: number;
  rcScoreMax?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface LeaderboardStats {
  averageScore: number;
  topCountries: Array<[string, number]>;
  topGrades: Array<[string, number]>;
  topCampuses: Array<[string, number]>;
  totalScoresByGrade: Array<[string, number]>;
  totalScoresByCampus: Array<[string, number]>;
  todayScoresByGrade: Array<[string, number]>;
  todayScoresByCampus: Array<[string, number]>;
}

export interface LeaderboardResult {
  users: LeaderboardUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: LeaderboardStats;
}

// Helper function to get grade sort order: Adult -> Grade 12 -> ... -> Grade 1 -> Kinder
function getGradeOrder(grade: string): number {
  if (grade === "Adult") return 0;
  if (grade === "Kinder") return 14;
  const match = grade.match(/Grade (\d+)/);
  if (match) {
    return 13 - parseInt(match[1]); // Grade 12 = 1, Grade 11 = 2, ..., Grade 1 = 12
  }
  return 999; // Unknown grades go last
}

// Helper function to find the current active semester based on today's date
async function getCurrentSemester() {
  const today = new Date();

  const currentSemester = await prisma.bPASemester.findFirst({
    where: {
      startDate: {
        lte: today,
      },
      endDate: {
        gte: today,
      },
    },
    select: {
      id: true,
    },
  });

  return currentSemester;
}


// Helper function to get today's scores by grade
async function getTodayScoresByGrade(): Promise<Array<[string, number]>> {
  // Get today's date range (start and end of day in server timezone)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  // Fetch all Novel (AR) completions from today with user data
  const novelCompletions = await prisma.novelQuestionCompleted.findMany({
    where: {
      createdAt: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          birthday: true,
        },
      },
    },
  });

  // Fetch all RC completions from today with user data
  const rcCompletions = await prisma.rCQuestionCompleted.findMany({
    where: {
      createdAt: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          birthday: true,
        },
      },
    },
  });

  // Aggregate scores by grade
  const scoresByGradeMap: Record<string, number> = {};

  // Process Novel completions
  for (const completion of novelCompletions) {
    const grade = calculateGrade(completion.user.birthday);
    if (grade !== "N/A") {
      scoresByGradeMap[grade] = (scoresByGradeMap[grade] || 0) + completion.score;
    }
  }

  // Process RC completions
  for (const completion of rcCompletions) {
    const grade = calculateGrade(completion.user.birthday);
    if (grade !== "N/A") {
      scoresByGradeMap[grade] = (scoresByGradeMap[grade] || 0) + completion.score;
    }
  }

  // Convert to array and sort by grade order
  const todayScoresByGrade = Object.entries(scoresByGradeMap)
    .sort(([gradeA], [gradeB]) => getGradeOrder(gradeA) - getGradeOrder(gradeB));

  return todayScoresByGrade;
}

// Helper function to get today's scores by campus
async function getTodayScoresByCampus(): Promise<Array<[string, number]>> {
  // Get today's date range (start and end of day in server timezone)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  // Fetch all Novel (AR) completions from today with user and campus data
  const novelCompletions = await prisma.novelQuestionCompleted.findMany({
    where: {
      createdAt: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          campus: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Fetch all RC completions from today with user and campus data
  const rcCompletions = await prisma.rCQuestionCompleted.findMany({
    where: {
      createdAt: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          campus: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Aggregate scores by campus
  const scoresByCampusMap: Record<string, number> = {};

  // Process Novel completions
  for (const completion of novelCompletions) {
    const campusName = completion.user.campus?.name || "Unknown";
    scoresByCampusMap[campusName] = (scoresByCampusMap[campusName] || 0) + completion.score;
  }

  // Process RC completions
  for (const completion of rcCompletions) {
    const campusName = completion.user.campus?.name || "Unknown";
    scoresByCampusMap[campusName] = (scoresByCampusMap[campusName] || 0) + completion.score;
  }

  // Convert to array and sort by total score (descending)
  const todayScoresByCampus = Object.entries(scoresByCampusMap)
    .sort(([, a], [, b]) => b - a);

  return todayScoresByCampus;
}

export async function getLeaderboardData(
  filters: LeaderboardFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 50 }
): Promise<LeaderboardResult> {
  // Get current semester
  const currentSemester = await getCurrentSemester();

  // Get ALL users to calculate proper ranks
  const users = await prisma.user.findMany({
    include: {
      country: {
        select: {
          id: true,
          name: true,
        },
      },
      campus: {
        select: {
          id: true,
          name: true,
        },
      },
      score: true,
      ARScore: true,
      RCScore: true,
      bpaScores: true,
    },
    orderBy: {
      score: {
        score: "desc",
      },
    },
  });

  // Fetch all current BPA level assignments in one query
  let levelAssignmentsMap = new Map<string, string>();
  if (currentSemester) {
    const assignments = await prisma.bPAUserLevelAssignment.findMany({
      where: {
        semesterId: currentSemester.id,
      },
      select: {
        userId: true,
        bpaLevel: {
          select: {
            name: true,
          },
        },
      },
    });

    levelAssignmentsMap = new Map(
      assignments.map((a) => [a.userId, a.bpaLevel.name])
    );
  }

  // Map and calculate additional scores
  const mappedUsers = users.map((user) => {
    const totalScore = user.score?.score || 0;
    const arScores = user.ARScore.reduce((sum, score) => sum + score.score, 0);
    const bpaScores = user.bpaScores.reduce((sum, score) => sum + score.score, 0);
    const novelScores = arScores + bpaScores;
    const rcScores = user.RCScore.reduce((sum, score) => sum + score.score, 0);
    const grade = calculateGrade(user.birthday);

    return {
      id: user.id,
      nickname: user.nickname,
      name: user.name,
      email: user.email,
      birthday: user.birthday,
      grade,
      country: user.country,
      campus: user.campus,
      parentName: user.parentName,
      studentName: user.studentName,
      currentBPALevel: levelAssignmentsMap.get(user.id) || null,
      totalScore,
      novelScores,
      rcScores,
    };
  });

  // Sort ALL users by total score to get global ranks
  const allSorted = [...mappedUsers].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.novelScores !== a.novelScores) {
      return b.novelScores - a.novelScores;
    }
    return b.rcScores - a.rcScores;
  });

  // Assign global ranks to ALL users
  const usersWithRanks = allSorted.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));

  // Calculate aggregate stats from ALL users (before filters) for dashboard
  const totalUsers = usersWithRanks.length;
  const totalScoreAll = usersWithRanks.reduce((sum, user) => sum + user.totalScore, 0);
  const averageScore = totalUsers > 0 ? Math.round(totalScoreAll / totalUsers) : 0;

  // Count users by country (all users)
  const countryDistributionAll = usersWithRanks.reduce(
    (acc, user) => {
      const countryName = user.country?.name || "Unknown";
      acc[countryName] = (acc[countryName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCountries = Object.entries(countryDistributionAll)
    .sort(([, a], [, b]) => b - a);

  // Count users by grade (all users, filter out N/A)
  const gradeDistributionAll = usersWithRanks.reduce(
    (acc, user) => {
      if (user.grade !== "N/A") {
        acc[user.grade] = (acc[user.grade] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const topGrades = Object.entries(gradeDistributionAll)
    .sort(([gradeA], [gradeB]) => getGradeOrder(gradeA) - getGradeOrder(gradeB));

  // Count users by campus (all users)
  const campusDistributionAll = usersWithRanks.reduce(
    (acc, user) => {
      const campusName = user.campus?.name || "Unknown";
      acc[campusName] = (acc[campusName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCampuses = Object.entries(campusDistributionAll)
    .sort(([, a], [, b]) => b - a);

  // Calculate total scores by grade (exclude N/A)
  const totalScoresByGradeMap = usersWithRanks.reduce(
    (acc, user) => {
      if (user.grade !== "N/A") {
        acc[user.grade] = (acc[user.grade] || 0) + user.totalScore;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalScoresByGrade = Object.entries(totalScoresByGradeMap)
    .sort(([gradeA], [gradeB]) => getGradeOrder(gradeA) - getGradeOrder(gradeB));

  // Calculate total scores by campus
  const totalScoresByCampusMap = usersWithRanks.reduce(
    (acc, user) => {
      const campusName = user.campus?.name || "Unknown";
      acc[campusName] = (acc[campusName] || 0) + user.totalScore;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalScoresByCampus = Object.entries(totalScoresByCampusMap)
    .sort(([, a], [, b]) => b - a);

  // Get today's scores by grade and campus
  const todayScoresByGrade = await getTodayScoresByGrade();
  const todayScoresByCampus = await getTodayScoresByCampus();

  // NOW apply filters to the ranked users
  let filteredUsers = usersWithRanks;

  // Apply search filter
  if (filters.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    filteredUsers = filteredUsers.filter((user) =>
      user.nickname?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.parentName?.toLowerCase().includes(searchLower) ||
      user.studentName?.toLowerCase().includes(searchLower)
    );
  }

  // Apply country filter
  if (filters.countryId) {
    filteredUsers = filteredUsers.filter((user) => user.country?.id === filters.countryId);
  }

  // Apply campus filter
  if (filters.campusId) {
    filteredUsers = filteredUsers.filter((user) => user.campus?.id === filters.campusId);
  }

  // Apply grade filter
  if (filters.grade) {
    filteredUsers = filteredUsers.filter((user) => user.grade === filters.grade);
  }

  if (filters.totalScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.totalScore >= filters.totalScoreMin!);
  }

  if (filters.totalScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.totalScore <= filters.totalScoreMax!);
  }

  if (filters.novelScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.novelScores >= filters.novelScoreMin!);
  }

  if (filters.novelScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.novelScores <= filters.novelScoreMax!);
  }

  if (filters.rcScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.rcScores >= filters.rcScoreMin!);
  }

  if (filters.rcScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.rcScores <= filters.rcScoreMax!);
  }

  // Calculate pagination on filtered users
  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / pagination.pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    users: paginatedUsers,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
    stats: {
      averageScore,
      topCountries,
      topGrades,
      topCampuses,
      totalScoresByGrade,
      totalScoresByCampus,
      todayScoresByGrade,
      todayScoresByCampus,
    },
  };
}

export async function getCountries(): Promise<CountryOption[]> {
  const countries = await prisma.country.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return countries;
}

export async function getGradeLeaderboardData(
  grade: string,
  filters: LeaderboardFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 100 }
): Promise<LeaderboardResult> {
  // Get current semester
  const currentSemester = await getCurrentSemester();

  // Get ALL users to calculate proper ranks
  const users = await prisma.user.findMany({
    include: {
      country: {
        select: {
          id: true,
          name: true,
        },
      },
      campus: {
        select: {
          id: true,
          name: true,
        },
      },
      score: true,
      ARScore: true,
      RCScore: true,
      bpaScores: true,
    },
    orderBy: {
      score: {
        score: "desc",
      },
    },
  });

  // Fetch all current BPA level assignments in one query
  let levelAssignmentsMap = new Map<string, string>();
  if (currentSemester) {
    const assignments = await prisma.bPAUserLevelAssignment.findMany({
      where: {
        semesterId: currentSemester.id,
      },
      select: {
        userId: true,
        bpaLevel: {
          select: {
            name: true,
          },
        },
      },
    });

    levelAssignmentsMap = new Map(
      assignments.map((a) => [a.userId, a.bpaLevel.name])
    );
  }

  // Map and calculate additional scores
  const mappedUsers = users.map((user) => {
    const totalScore = user.score?.score || 0;
    const arScores = user.ARScore.reduce((sum, score) => sum + score.score, 0);
    const bpaScores = user.bpaScores.reduce((sum, score) => sum + score.score, 0);
    const novelScores = arScores + bpaScores;
    const rcScores = user.RCScore.reduce((sum, score) => sum + score.score, 0);
    const userGrade = calculateGrade(user.birthday);

    return {
      id: user.id,
      nickname: user.nickname,
      name: user.name,
      email: user.email,
      birthday: user.birthday,
      grade: userGrade,
      country: user.country,
      campus: user.campus,
      parentName: user.parentName,
      studentName: user.studentName,
      currentBPALevel: levelAssignmentsMap.get(user.id) || null,
      totalScore,
      novelScores,
      rcScores,
    };
  });

  // Calculate aggregate stats from ALL users (before grade filter) for dashboard
  const totalUsers = mappedUsers.length;
  const totalScoreAll = mappedUsers.reduce((sum, user) => sum + user.totalScore, 0);
  const averageScore = totalUsers > 0 ? Math.round(totalScoreAll / totalUsers) : 0;

  // Count users by country (all users)
  const countryDistributionAll = mappedUsers.reduce(
    (acc, user) => {
      const countryName = user.country?.name || "Unknown";
      acc[countryName] = (acc[countryName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCountries = Object.entries(countryDistributionAll)
    .sort(([, a], [, b]) => b - a);

  // Count users by grade (all users, filter out N/A)
  const gradeDistributionAll = mappedUsers.reduce(
    (acc, user) => {
      if (user.grade !== "N/A") {
        acc[user.grade] = (acc[user.grade] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const topGrades = Object.entries(gradeDistributionAll)
    .sort(([gradeA], [gradeB]) => getGradeOrder(gradeA) - getGradeOrder(gradeB));

  // Count users by campus (all users)
  const campusDistributionAll = mappedUsers.reduce(
    (acc, user) => {
      const campusName = user.campus?.name || "Unknown";
      acc[campusName] = (acc[campusName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCampuses = Object.entries(campusDistributionAll)
    .sort(([, a], [, b]) => b - a);

  // Calculate total scores by grade (exclude N/A) - using all users for consistency
  const totalScoresByGradeMap = mappedUsers.reduce(
    (acc, user) => {
      if (user.grade !== "N/A") {
        acc[user.grade] = (acc[user.grade] || 0) + user.totalScore;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalScoresByGrade = Object.entries(totalScoresByGradeMap)
    .sort(([gradeA], [gradeB]) => getGradeOrder(gradeA) - getGradeOrder(gradeB));

  // Calculate total scores by campus - using all users for consistency
  const totalScoresByCampusMap = mappedUsers.reduce(
    (acc, user) => {
      const campusName = user.campus?.name || "Unknown";
      acc[campusName] = (acc[campusName] || 0) + user.totalScore;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalScoresByCampus = Object.entries(totalScoresByCampusMap)
    .sort(([, a], [, b]) => b - a);

  // Get today's scores by grade and campus
  const todayScoresByGrade = await getTodayScoresByGrade();
  const todayScoresByCampus = await getTodayScoresByCampus();

  // Filter by specified grade FIRST to get all users in this grade
  const gradeUsers = mappedUsers.filter((user) => user.grade === grade);

  // Sort ALL grade users by score to get grade-specific ranks
  const sortedGradeUsers = [...gradeUsers].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.novelScores !== a.novelScores) {
      return b.novelScores - a.novelScores;
    }
    return b.rcScores - a.rcScores;
  });

  // Assign ranks based on position within this grade
  const usersWithRanks = sortedGradeUsers.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));

  // NOW apply filters to the ranked grade users
  let filteredUsers = usersWithRanks;

  // Apply search filter
  if (filters.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    filteredUsers = filteredUsers.filter((user) =>
      user.nickname?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.parentName?.toLowerCase().includes(searchLower) ||
      user.studentName?.toLowerCase().includes(searchLower)
    );
  }

  // Apply country filter
  if (filters.countryId) {
    filteredUsers = filteredUsers.filter((user) => user.country?.id === filters.countryId);
  }

  // Apply campus filter
  if (filters.campusId) {
    filteredUsers = filteredUsers.filter((user) => user.campus?.id === filters.campusId);
  }

  if (filters.totalScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.totalScore >= filters.totalScoreMin!);
  }

  if (filters.totalScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.totalScore <= filters.totalScoreMax!);
  }

  if (filters.novelScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.novelScores >= filters.novelScoreMin!);
  }

  if (filters.novelScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.novelScores <= filters.novelScoreMax!);
  }

  if (filters.rcScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.rcScores >= filters.rcScoreMin!);
  }

  if (filters.rcScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.rcScores <= filters.rcScoreMax!);
  }

  // Calculate pagination on filtered users
  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / pagination.pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    users: paginatedUsers,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
    stats: {
      averageScore,
      topCountries,
      topGrades,
      topCampuses,
      totalScoresByGrade,
      totalScoresByCampus,
      todayScoresByGrade,
      todayScoresByCampus,
    },
  };
}

export async function getMonthlyLeaderboardData(
  filters: LeaderboardFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 50 },
  year?: number,
  month?: number,
): Promise<LeaderboardResult> {
  // Use current month/year if not provided
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1; // getMonth() returns 0-11

  // Get current semester
  const currentSemester = await getCurrentSemester();

  // Get ALL users with their monthly scores to calculate proper ranks
  const users = await prisma.user.findMany({
    include: {
      country: {
        select: {
          id: true,
          name: true,
        },
      },
      campus: {
        select: {
          id: true,
          name: true,
        },
      },
      monthlyARScores: {
        where: {
          year: targetYear,
          month: targetMonth,
        },
      },
      monthlyRCScores: {
        where: {
          year: targetYear,
          month: targetMonth,
        },
      },
      monthlyBPAScores: {
        where: {
          year: targetYear,
          month: targetMonth,
        },
      },
    },
  });

  // Fetch all current BPA level assignments in one query
  let levelAssignmentsMap = new Map<string, string>();
  if (currentSemester) {
    const assignments = await prisma.bPAUserLevelAssignment.findMany({
      where: {
        semesterId: currentSemester.id,
      },
      select: {
        userId: true,
        bpaLevel: {
          select: {
            name: true,
          },
        },
      },
    });

    levelAssignmentsMap = new Map(
      assignments.map((a) => [a.userId, a.bpaLevel.name])
    );
  }

  // Map and calculate monthly scores
  const mappedUsers = users
    .map((user) => {
      const arScores = user.monthlyARScores.reduce((sum, score) => sum + score.score, 0);
      const bpaScores = user.monthlyBPAScores.reduce((sum, score) => sum + score.score, 0);
      const novelScores = arScores + bpaScores;
      const rcScores = user.monthlyRCScores.reduce((sum, score) => sum + score.score, 0);
      const totalScore = novelScores + rcScores;
      const grade = calculateGrade(user.birthday);

      return {
        id: user.id,
        nickname: user.nickname,
        name: user.name,
        email: user.email,
        birthday: user.birthday,
        grade,
        country: user.country,
        campus: user.campus,
        parentName: user.parentName,
        studentName: user.studentName,
        currentBPALevel: levelAssignmentsMap.get(user.id) || null,
        totalScore,
        novelScores,
        rcScores,
      };
    })
    .filter(user => user.totalScore > 0); // Only include users with scores this month

  // Sort ALL monthly users by score to get monthly ranks
  const allSorted = [...mappedUsers].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.novelScores !== a.novelScores) {
      return b.novelScores - a.novelScores;
    }
    return b.rcScores - a.rcScores;
  });

  // Assign ranks based on position in monthly sorted list
  const usersWithRanks = allSorted.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));

  // For monthly tab, we need to fetch ALL users again for global stats (not just monthly active)
  // This ensures stats are consistent across all tabs
  const allUsers = await prisma.user.findMany({
    include: {
      country: {
        select: {
          id: true,
          name: true,
        },
      },
      score: true,
    },
  });

  const allUsersWithGrades = allUsers.map((user) => {
    const totalScore = user.score?.score || 0;
    const grade = calculateGrade(user.birthday);
    return {
      grade,
      country: user.country,
      totalScore,
    };
  });

  // Calculate aggregate stats from ALL users (for dashboard consistency)
  const totalUsers = allUsersWithGrades.length;
  const totalScoreAll = allUsersWithGrades.reduce((sum, user) => sum + user.totalScore, 0);
  const averageScore = totalUsers > 0 ? Math.round(totalScoreAll / totalUsers) : 0;

  // Count users by country (all users)
  const countryDistributionAll = allUsersWithGrades.reduce(
    (acc, user) => {
      const countryName = user.country?.name || "Unknown";
      acc[countryName] = (acc[countryName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCountries = Object.entries(countryDistributionAll)
    .sort(([, a], [, b]) => b - a);

  // Count users by grade (all users, filter out N/A)
  const gradeDistributionAll = allUsersWithGrades.reduce(
    (acc, user) => {
      if (user.grade !== "N/A") {
        acc[user.grade] = (acc[user.grade] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const topGrades = Object.entries(gradeDistributionAll)
    .sort(([gradeA], [gradeB]) => getGradeOrder(gradeA) - getGradeOrder(gradeB));

  // For campus distribution, we need to use the full user data with campus info
  const allUsersWithCampus = await prisma.user.findMany({
    include: {
      campus: {
        select: {
          id: true,
          name: true,
        },
      },
      score: true,
    },
  });

  // Count users by campus (all users)
  const campusDistributionAll = allUsersWithCampus.reduce(
    (acc, user) => {
      const campusName = user.campus?.name || "Unknown";
      acc[campusName] = (acc[campusName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCampuses = Object.entries(campusDistributionAll)
    .sort(([, a], [, b]) => b - a);

  // Calculate total scores by grade (exclude N/A) - using all users for consistency
  const totalScoresByGradeMap = allUsersWithGrades.reduce(
    (acc, user) => {
      if (user.grade !== "N/A") {
        acc[user.grade] = (acc[user.grade] || 0) + user.totalScore;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalScoresByGrade = Object.entries(totalScoresByGradeMap)
    .sort(([gradeA], [gradeB]) => getGradeOrder(gradeA) - getGradeOrder(gradeB));

  // Calculate total scores by campus - using all users with campus info for consistency
  const totalScoresByCampusMap = allUsersWithCampus.reduce(
    (acc, user) => {
      const campusName = user.campus?.name || "Unknown";
      const userTotalScore = user.score?.score || 0;
      acc[campusName] = (acc[campusName] || 0) + userTotalScore;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalScoresByCampus = Object.entries(totalScoresByCampusMap)
    .sort(([, a], [, b]) => b - a);

  // Get today's scores by grade and campus
  const todayScoresByGrade = await getTodayScoresByGrade();
  const todayScoresByCampus = await getTodayScoresByCampus();

  // NOW apply filters to the ranked users
  let filteredUsers = usersWithRanks;

  // Apply search filter
  if (filters.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    filteredUsers = filteredUsers.filter((user) =>
      user.nickname?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.parentName?.toLowerCase().includes(searchLower) ||
      user.studentName?.toLowerCase().includes(searchLower)
    );
  }

  // Apply country filter
  if (filters.countryId) {
    filteredUsers = filteredUsers.filter((user) => user.country?.id === filters.countryId);
  }

  // Apply campus filter
  if (filters.campusId) {
    filteredUsers = filteredUsers.filter((user) => user.campus?.id === filters.campusId);
  }

  // Apply grade filter
  if (filters.grade) {
    filteredUsers = filteredUsers.filter((user) => user.grade === filters.grade);
  }

  if (filters.totalScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.totalScore >= filters.totalScoreMin!);
  }

  if (filters.totalScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.totalScore <= filters.totalScoreMax!);
  }

  if (filters.novelScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.novelScores >= filters.novelScoreMin!);
  }

  if (filters.novelScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.novelScores <= filters.novelScoreMax!);
  }

  if (filters.rcScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.rcScores >= filters.rcScoreMin!);
  }

  if (filters.rcScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.rcScores <= filters.rcScoreMax!);
  }

  // Calculate pagination on filtered users
  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / pagination.pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    users: paginatedUsers,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
    stats: {
      averageScore,
      topCountries,
      topGrades,
      topCampuses,
      totalScoresByGrade,
      totalScoresByCampus,
      todayScoresByGrade,
      todayScoresByCampus,
    },
  };
}
