import { toZonedTime } from "date-fns-tz";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

import { getMonthlyUserRanking } from "./queries/get-monthly-user-ranking.query";

interface MonthlyUserStatsProps {
  userId: string;
}

export async function MonthlyUserStats({ userId }: MonthlyUserStatsProps) {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  // Get user's grade
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { birthday: true },
  });
  const userGrade = calculateGrade(user?.birthday || null);

  // Get monthly AR, RC, and BPA scores
  const [monthlyARScores, monthlyRCScores, monthlyBPAScores] = await Promise.all([
    prisma.monthlyARScore.aggregate({
      where: {
        userId,
        year,
        month,
      },
      _sum: {
        score: true,
      },
    }),
    prisma.monthlyRCScore.aggregate({
      where: {
        userId,
        year,
        month,
      },
      _sum: {
        score: true,
      },
    }),
    prisma.monthlyBPAScore.aggregate({
      where: {
        userId,
        year,
        month,
      },
      _sum: {
        score: true,
      },
    }),
  ]);

  const arScore = monthlyARScores._sum.score || 0;
  const bpaScore = monthlyBPAScores._sum.score || 0;
  const novelScore = arScore + bpaScore; // Novel includes both AR and BPA
  const rcScore = monthlyRCScores._sum.score || 0;
  const totalScore = novelScore + rcScore;

  // Get monthly ranking
  const monthlyRanking = await getMonthlyUserRanking(userId);

  // Get month name
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = monthNames[month - 1];

  return (
    <Card className="h-full gap-0 bg-white py-0 shadow-lg">
      <CardHeader className="rounded-t-lg bg-primary text-white">
        <CardTitle className="py-1 text-center text-lg font-semibold">
          My {currentMonthName} Points & Rank
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
                {rcScore.toLocaleString()}
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

            {/* Monthly Ranking Badges */}
            <div className="flex flex-col gap-2">
              {monthlyRanking && (
                <>
                  <Badge
                    variant="destructive"
                    className="flex items-center justify-center bg-primary px-4 py-2 font-bold text-white hover:bg-primary"
                  >
                    #{monthlyRanking.userRank} Overall ({monthlyRanking.overallRankingPercentage})
                  </Badge>
                  <Badge
                    variant="destructive"
                    className="flex items-center justify-center bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-600"
                  >
                    #{monthlyRanking.userRankInGrade} in {userGrade} ({monthlyRanking.gradeRankingPercentage})
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}