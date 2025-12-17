import { apiClient } from "./client";

export interface UserStatsLevel {
  level: string;
  score: number;
  count: number;
}

export interface UserRankingData {
  overallRankingPercentage: string;
  gradeRankingPercentage: string;
  totalUsers: number;
  usersInGrade: number;
  userRank: number;
  userRankInGrade: number;
}

export interface MedalLevel {
  levelType: string;
  levelId: string;
  levelName: string;
  medals: {
    gold: { count: number; imageUrl: string };
    silver: { count: number; imageUrl: string };
    bronze: { count: number; imageUrl: string };
  };
}

export interface RecentMedal {
  id: string;
  medalType: string;
  levelType: string;
  levelName: string;
  year: number;
  month: number;
  score: number;
}

export interface UserStatsData {
  id: string;
  nickname: string;
  grade: string;
  arStats: UserStatsLevel[];
  rcStats: UserStatsLevel[];
  bpaStats: UserStatsLevel[];
  totalArScore: number;
  totalRcScore: number;
  totalBpaScore: number;
  ranking?: UserRankingData | null;
  medals?: {
    totalGold: number;
    totalSilver: number;
    totalBronze: number;
    images: {
      gold: { imageUrl: string | null; width: number; height: number };
      silver: { imageUrl: string | null; width: number; height: number };
      bronze: { imageUrl: string | null; width: number; height: number };
    };
    medalsByLevel?: MedalLevel[];
    recent?: RecentMedal[];
  };
}

export async function fetchUserStats(userId: string): Promise<UserStatsData> {
  const response = await apiClient.get<UserStatsData>(`/api/user-stats/${userId}`);
  return response.data;
}
