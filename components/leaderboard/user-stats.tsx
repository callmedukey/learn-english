import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getUserRanking } from "./queries/user-ranking.query";
import { getUserStats } from "./queries/user-stats.query";
import { UserStatsPopover } from "./user-stats-popover";

interface UserStatsProps {
  userId: string;
}

export async function UserStats({ userId }: UserStatsProps) {
  const [userStats, userRanking] = await Promise.all([
    getUserStats(userId),
    getUserRanking(userId),
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

  const totalScore = userStats.totalArScore + userStats.totalRcScore;

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
                  {userStats.totalArScore.toLocaleString()}
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
                      className="bg-primary px-4 py-2 font-bold text-white hover:bg-primary"
                    >
                      {userRanking.overallRankingPercentage} Overall
                    </Badge>
                    <Badge
                      variant="destructive"
                      className="bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-600"
                    >
                      {userRanking.gradeRankingPercentage} in {userStats.grade}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </UserStatsPopover>
  );
}
