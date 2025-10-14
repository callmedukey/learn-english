import { MedalDisplayWithDialog } from "@/components/medals/medal-display-with-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserMedalCounts, getUserMedalsForDisplay } from "@/server-queries/user-medals";

import { getUserRanking } from "./queries/user-ranking.query";
import { getUserStats } from "./queries/user-stats.query";
import { UserStatsPopover } from "./user-stats-popover";

interface UserStatsProps {
  userId: string;
}

export async function UserStats({ userId }: UserStatsProps) {
  const [userStats, userRanking, medalCounts, userMedals] = await Promise.all([
    getUserStats(userId),
    getUserRanking(userId),
    getUserMedalCounts(userId),
    getUserMedalsForDisplay(userId),
  ]);

  if (!userStats) {
    return (
      <Card className="h-full gap-0 bg-white py-0 shadow-lg">
        <CardHeader className="rounded-t-lg bg-primary text-white">
          <CardTitle className="py-1 text-center text-lg font-semibold">
            My Points & My Rank
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 text-center">
            <div className="text-gray-500">No stats available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const novelScore = userStats.totalArScore + userStats.totalBpaScore; // Novel includes AR + BPA
  const totalScore = novelScore + userStats.totalRcScore;

  return (
    <UserStatsPopover userId={userId}>
      <Card className="h-full cursor-pointer gap-0 bg-white py-0 shadow-lg transition-colors hover:bg-gray-50">
        <CardHeader className="rounded-t-lg bg-primary text-white">
          <CardTitle className="py-1 text-center text-lg font-semibold">
            My Points & My Rank
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-8">
          <div className="space-y-4 text-center">
            {/* Novel Stats */}
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">NOVEL</div>
              <div className="rounded-lg bg-gray-100 p-2">
                <div className="text-base font-bold text-gray-800">
                  {novelScore.toLocaleString()}
                </div>
              </div>
            </div>

            {/* RC Stats */}
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">R.C</div>
              <div className="rounded-lg bg-gray-100 p-2">
                <div className="text-base font-bold text-gray-800">
                  {userStats.totalRcScore.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Total Stats */}
            <div className="space-y-2">
              <div className="text-lg font-bold text-primary">TOTAL</div>
              <div className="rounded-lg bg-gray-100 p-2">
                <div className="text-base font-bold text-gray-800">
                  {totalScore.toLocaleString()}
                </div>
              </div>

              {/* Ranking Badges */}
              <div className="flex flex-col gap-2">
                {userRanking && (
                  <>
                    <Badge
                      variant="destructive"
                      className="flex items-center justify-center bg-primary px-4 py-2 font-bold text-white hover:bg-primary"
                    >
                      #{userRanking.userRank} Overall ({userRanking.overallRankingPercentage})
                    </Badge>
                    <Badge
                      variant="destructive"
                      className="flex items-center justify-center bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-600"
                    >
                      #{userRanking.userRankInGrade} in {userStats.grade} ({userRanking.gradeRankingPercentage})
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Medals Section */}
            <div className="mt-4 space-y-2">
              <div className="text-lg font-bold text-primary">
                MEDALS {userMedals.length > 0 ? `(${medalCounts.totalGold + medalCounts.totalSilver + medalCounts.totalBronze})` : '(0)'}
              </div>
              {userMedals.length > 0 ? (
                <MedalDisplayWithDialog 
                  medals={userMedals} 
                  userId={userId}
                  maxDisplay={6} 
                />
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500">No medals earned yet</p>
                  <p className="mt-1 text-xs text-gray-400">Compete in monthly challenges to earn medals!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </UserStatsPopover>
  );
}
