import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getUserStats } from "./queries/user-stats.query";

interface UserStatsProps {
  userId: string;
}

export async function UserStats({ userId }: UserStatsProps) {
  const userStats = await getUserStats(userId);

  return (
    <Card className="mx-auto h-full gap-0 bg-white py-0 shadow-lg lg:max-w-[20rem]">
      <CardHeader className="rounded-t-lg bg-primary text-white">
        <CardTitle className="py-1 text-center text-lg font-semibold">
          My Points & My Rank
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 text-center">
          {/* Novel Stats */}
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">NOVEL</div>
            <div className="rounded-lg bg-gray-100 p-2">
              <div className="text-base font-bold text-gray-800">
                {userStats.novelScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* RC Stats */}
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">R.C</div>
            <div className="rounded-lg bg-gray-100 p-2">
              <div className="text-base font-bold text-gray-800">
                {userStats.rcScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Total Stats */}
          <div className="space-y-2">
            <div className="text-lg font-bold text-primary">TOTAL</div>
            <div className="rounded-lg bg-gray-100 p-2">
              <div className="text-base font-bold text-gray-800">
                {userStats.totalScore.toLocaleString()}
              </div>
            </div>
            <Badge
              variant="destructive"
              className="bg-primary px-4 py-2 font-bold text-white hover:bg-primary"
            >
              TOP : {userStats.percentile}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
