"use client";

import { use } from "react";

import { MedalLevelDisplayWithDialog } from "@/components/medals/medal-level-display-with-dialog";
import { Badge } from "@/components/ui/badge";

interface UserStatsContentProps {
  userId: string;
}

interface UserRankingData {
  overallRankingPercentage: string;
  gradeRankingPercentage: string;
  totalUsers: number;
  usersInGrade: number;
  userRank: number;
  userRankInGrade: number;
}

interface UserStatsData {
  id: string;
  nickname: string;
  grade: string;
  arStats: {
    level: string;
    score: number;
    count: number;
  }[];
  rcStats: {
    level: string;
    score: number;
    count: number;
  }[];
  bpaStats: {
    level: string;
    score: number;
    count: number;
  }[];
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
    medalsByLevel?: Array<{
      levelType: string;
      levelId: string;
      levelName: string;
      medals: {
        gold: { count: number; imageUrl: string };
        silver: { count: number; imageUrl: string };
        bronze: { count: number; imageUrl: string };
      };
    }>;
    recent?: Array<{
      id: string;
      medalType: string;
      levelType: string;
      levelName: string;
      year: number;
      month: number;
      score: number;
    }>;
  };
}

// Cache promises to prevent multiple requests for the same userId
const promiseCache = new Map<string, Promise<UserStatsData>>();

async function fetchUserStats(userId: string): Promise<UserStatsData> {
  const response = await fetch(`/api/user-stats/${userId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error("Failed to fetch user stats");
  }

  return response.json();
}

function getUserStatsPromise(userId: string): Promise<UserStatsData> {
  if (!promiseCache.has(userId)) {
    promiseCache.set(userId, fetchUserStats(userId));
  }
  return promiseCache.get(userId)!;
}

export function UserStatsContent({ userId }: UserStatsContentProps) {
  const userStats = use(getUserStatsPromise(userId));

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">
          {userStats.nickname}
        </h3>
        <p className="text-xs text-gray-600">{userStats.grade}</p>

        {/* Ranking Badges */}
        {userStats.ranking && (
          <div className="mt-2 flex flex-col gap-1">
            <Badge
              variant="destructive"
              className="flex justify-center bg-primary px-2 py-1 text-xs font-bold text-white hover:bg-primary"
            >
              {userStats.ranking.overallRankingPercentage} Overall
            </Badge>
            <Badge
              variant="destructive"
              className="flex justify-center bg-amber-500 px-2 py-1 text-xs font-bold text-white hover:bg-amber-600"
            >
              {userStats.ranking.gradeRankingPercentage} in {userStats.grade}
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Novel Stats */}
        <div>
          <div className="mb-1 text-xs font-semibold text-amber-900">
            NOVEL - Total: {userStats.totalArScore.toLocaleString()}
          </div>
          {userStats.arStats.length > 0 ? (
            <div className="space-y-0.5">
              {userStats.arStats.map((stat) => (
                <div key={stat.level} className="flex justify-between text-xs">
                  <span className="text-gray-700">{stat.level}</span>
                  <span className="font-medium text-gray-900">
                    {stat.score.toLocaleString()} ({stat.count})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No AR scores yet</p>
          )}
        </div>

        {/* VIP Scores (BPA) Stats */}
        <div>
          <div className="mb-1 text-xs font-semibold text-amber-900">
            VIP SCORES (BPA) - Total: {userStats.totalBpaScore.toLocaleString()}
          </div>
          {userStats.bpaStats.length > 0 ? (
            <div className="space-y-0.5">
              {userStats.bpaStats.map((stat) => (
                <div key={stat.level} className="flex justify-between text-xs">
                  <span className="text-gray-700">{stat.level}</span>
                  <span className="font-medium text-gray-900">
                    {stat.score.toLocaleString()} ({stat.count})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No VIP scores yet</p>
          )}
        </div>

        {/* RC Stats */}
        <div>
          <div className="mb-1 text-xs font-semibold text-amber-900">
            READING COMPREHENSION - Total:{" "}
            {userStats.totalRcScore.toLocaleString()}
          </div>
          {userStats.rcStats.length > 0 ? (
            <div className="space-y-0.5">
              {userStats.rcStats.map((stat) => (
                <div key={stat.level} className="flex justify-between text-xs">
                  <span className="text-gray-700">{stat.level}</span>
                  <span className="font-medium text-gray-900">
                    {stat.score.toLocaleString()} ({stat.count})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No RC scores yet</p>
          )}
        </div>

        {/* Total */}
        <div className="border-t pt-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-900">TOTAL SCORE</span>
            <span className="text-primary">
              {(
                userStats.totalArScore + userStats.totalBpaScore + userStats.totalRcScore
              ).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Medals Section */}
        <div className="border-t pt-2">
          <div className="mb-2 text-xs font-semibold text-amber-900">
            MEDALS {userStats.medals ? `(${userStats.medals.totalGold + userStats.medals.totalSilver + userStats.medals.totalBronze} total)` : ''}
          </div>
          {userStats.medals && userStats.medals.medalsByLevel && (userStats.medals.totalGold > 0 || userStats.medals.totalSilver > 0 || userStats.medals.totalBronze > 0) ? (
            <>
              {/* Medal display by level */}
              <div className="space-y-2">
                {userStats.medals.medalsByLevel.map((level) => (
                  <MedalLevelDisplayWithDialog
                    key={`${level.levelType}-${level.levelId}`}
                    levelName={level.levelName}
                    medals={level.medals}
                    userId={userId}
                  />
                ))}
              </div>
              
              {/* Recent Medals */}
              {userStats.medals && userStats.medals.recent && userStats.medals.recent.length > 0 && (
                <div className="mt-3 space-y-0.5 border-t pt-2">
                  <div className="text-xs text-gray-600">Recent:</div>
                  {userStats.medals.recent.slice(0, 3).map((medal) => (
                    <div key={medal.id} className="flex justify-between text-xs">
                      <span className="text-gray-700">
                        {medal.levelName} ({medal.year}/{medal.month})
                      </span>
                      <span className="font-medium capitalize text-gray-900">
                        {medal.medalType.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-500">No medals earned yet</p>
              <p className="mt-1 text-xs text-gray-400">Compete in monthly challenges to earn medals!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
