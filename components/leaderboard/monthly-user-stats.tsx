import { toZonedTime } from "date-fns-tz";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { prisma } from "@/prisma/prisma-client";

interface MonthlyUserStatsProps {
  userId: string;
}

export async function MonthlyUserStats({ userId }: MonthlyUserStatsProps) {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  // Get monthly AR scores
  const monthlyARScores = await prisma.monthlyARScore.aggregate({
    where: {
      userId,
      year,
      month,
    },
    _sum: {
      score: true,
    },
  });

  // Get monthly RC scores
  const monthlyRCScores = await prisma.monthlyRCScore.aggregate({
    where: {
      userId,
      year,
      month,
    },
    _sum: {
      score: true,
    },
  });

  const novelScore = monthlyARScores._sum.score || 0;
  const rcScore = monthlyRCScores._sum.score || 0;
  const totalScore = novelScore + rcScore;

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
          My {currentMonthName} Points
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-amber-900">NOVEL</div>
            <div className="text-2xl font-bold text-primary">
              {novelScore.toLocaleString()}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-lg font-bold text-amber-900">R.C</div>
            <div className="text-2xl font-bold text-primary">
              {rcScore.toLocaleString()}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="text-lg font-bold text-amber-900">TOTAL</div>
              <div className="text-3xl font-bold text-primary">
                {totalScore.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}