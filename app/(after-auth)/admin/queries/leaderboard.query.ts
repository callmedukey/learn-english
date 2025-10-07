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
  parentName: string | null;
  studentName: string | null;
  rank: number;
  totalScore: number;
  arScores: number;
  rcScores: number;
}

export interface CountryOption {
  id: string;
  name: string;
}

export interface LeaderboardFilters {
  countryId?: string;
  grade?: string;
  searchQuery?: string;
  totalScoreMin?: number;
  totalScoreMax?: number;
  lexileScoreMin?: number;
  lexileScoreMax?: number;
  rcScoreMin?: number;
  rcScoreMax?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface LeaderboardResult {
  users: LeaderboardUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getLeaderboardData(
  filters: LeaderboardFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 50 }
): Promise<LeaderboardResult> {
  // Get ALL users to calculate proper ranks
  const users = await prisma.user.findMany({
    include: {
      country: {
        select: {
          id: true,
          name: true,
        },
      },
      score: true,
      ARScore: true,
      RCScore: true,
    },
    orderBy: {
      score: {
        score: "desc",
      },
    },
  });

  // Map and calculate additional scores
  const mappedUsers = users.map((user) => {
    const totalScore = user.score?.score || 0;
    const arScores = user.ARScore.reduce((sum, score) => sum + score.score, 0);
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
      parentName: user.parentName,
      studentName: user.studentName,
      totalScore,
      arScores,
      rcScores,
    };
  });

  // Sort ALL users by total score to get global ranks
  const allSorted = [...mappedUsers].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.arScores !== a.arScores) {
      return b.arScores - a.arScores;
    }
    return b.rcScores - a.rcScores;
  });

  // Assign global ranks to ALL users
  const usersWithRanks = allSorted.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));

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

  if (filters.lexileScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.arScores >= filters.lexileScoreMin!);
  }

  if (filters.lexileScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.arScores <= filters.lexileScoreMax!);
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
  // Get ALL users to calculate proper ranks
  const users = await prisma.user.findMany({
    include: {
      country: {
        select: {
          id: true,
          name: true,
        },
      },
      score: true,
      ARScore: true,
      RCScore: true,
    },
    orderBy: {
      score: {
        score: "desc",
      },
    },
  });

  // Map and calculate additional scores
  const mappedUsers = users.map((user) => {
    const totalScore = user.score?.score || 0;
    const arScores = user.ARScore.reduce((sum, score) => sum + score.score, 0);
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
      parentName: user.parentName,
      studentName: user.studentName,
      totalScore,
      arScores,
      rcScores,
    };
  });

  // Filter by specified grade FIRST to get all users in this grade
  const gradeUsers = mappedUsers.filter((user) => user.grade === grade);

  // Sort ALL grade users by score to get grade-specific ranks
  const sortedGradeUsers = [...gradeUsers].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.arScores !== a.arScores) {
      return b.arScores - a.arScores;
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

  if (filters.totalScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.totalScore >= filters.totalScoreMin!);
  }

  if (filters.totalScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.totalScore <= filters.totalScoreMax!);
  }

  if (filters.lexileScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.arScores >= filters.lexileScoreMin!);
  }

  if (filters.lexileScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.arScores <= filters.lexileScoreMax!);
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

  // Get ALL users with their monthly scores to calculate proper ranks
  const users = await prisma.user.findMany({
    include: {
      country: {
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
    },
  });

  // Map and calculate monthly scores
  const mappedUsers = users
    .map((user) => {
      const arScores = user.monthlyARScores.reduce((sum, score) => sum + score.score, 0);
      const rcScores = user.monthlyRCScores.reduce((sum, score) => sum + score.score, 0);
      const totalScore = arScores + rcScores;
      const grade = calculateGrade(user.birthday);

      return {
        id: user.id,
        nickname: user.nickname,
        name: user.name,
        email: user.email,
        birthday: user.birthday,
        grade,
        country: user.country,
        parentName: user.parentName,
        studentName: user.studentName,
        totalScore,
        arScores,
        rcScores,
      };
    })
    .filter(user => user.totalScore > 0); // Only include users with scores this month

  // Sort ALL monthly users by score to get monthly ranks
  const allSorted = [...mappedUsers].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.arScores !== a.arScores) {
      return b.arScores - a.arScores;
    }
    return b.rcScores - a.rcScores;
  });

  // Assign ranks based on position in monthly sorted list
  const usersWithRanks = allSorted.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));

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

  if (filters.lexileScoreMin !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.arScores >= filters.lexileScoreMin!);
  }

  if (filters.lexileScoreMax !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.arScores <= filters.lexileScoreMax!);
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
  };
}
