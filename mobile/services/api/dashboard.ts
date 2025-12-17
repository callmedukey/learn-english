import { apiClient } from "./client";

// Types
export interface ContinueLearningNovel {
  id: string;
  title: string;
  arLevel: string | null;
  completedChapters: number;
  totalChapters: number;
  progress: number;
  lastUpdated: string;
}

export interface ContinueLearningRC {
  keywordId: string;
  keyword: string;
  rcLevelId: string;
  rcLevel: string;
  lastPracticed: string;
}

export interface ContinueLearningData {
  novel: ContinueLearningNovel | null;
  rc: ContinueLearningRC | null;
}

export interface RankingUser {
  id: string;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  rank: number;
  campusId?: string | null;
  campusName?: string;
}

export interface UserRankingData {
  rank: number;
  total: number;
  percentile: number;
}

export interface GradeRankingData extends UserRankingData {
  grade: string;
}

export interface MedalCounts {
  gold: number;
  silver: number;
  bronze: number;
}

export interface AllTimeStats {
  novelScore: number;
  rcScore: number;
  totalScore: number;
  overallRank: UserRankingData;
  gradeRank: GradeRankingData;
  medals: MedalCounts;
}

export interface MonthlyStats {
  novelScore: number;
  rcScore: number;
  totalScore: number;
  overallRank: UserRankingData;
  gradeRank: GradeRankingData;
}

export interface RankingsByType {
  total: RankingUser[];
  novel: RankingUser[];
  rc: RankingUser[];
}

export interface LeaderboardData {
  allTime: {
    overall: RankingsByType;
    grade: RankingsByType;
  };
  monthly: {
    overall: RankingsByType;
    grade: RankingsByType;
  };
}

export interface DashboardData {
  user: {
    nickname: string;
    grade: string;
  };
  continueLearning: ContinueLearningData;
  allTimeStats: AllTimeStats;
  monthlyStats: MonthlyStats;
  leaderboards: LeaderboardData;
}

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>("/api/mobile/dashboard");
  return response.data;
}
