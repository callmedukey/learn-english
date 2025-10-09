import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LeaderboardStats as Stats } from "../queries/leaderboard.query";

interface LeaderboardStatsProps {
  totalUsers: number;
  stats: Stats;
}

export default function LeaderboardStats({ totalUsers, stats }: LeaderboardStatsProps) {
  const { topCountries, topGrades, topCampuses, totalScoresByGrade, totalScoresByCampus, todayScoresByGrade, todayScoresByCampus } = stats;

  return (
    <div className="space-y-6">
      {/* First Row: User Counts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Users
            </p>
            <p className="text-2xl font-semibold">{totalUsers}</p>
          </CardContent>
        </Card>

        {/* User Count by Country */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              User Count by Country
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {topCountries.map(([country, count]) => (
                <div key={country} className="flex justify-between text-sm">
                  <span>{country}</span>
                  <span className="font-medium text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Count by Grade */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              User Count by Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {topGrades.map(([grade, count]) => (
                <div key={grade} className="flex justify-between text-sm">
                  <span>{grade}</span>
                  <span className="font-medium text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Count by Campus */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              User Count by Campus
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {topCampuses.map(([campus, count]) => (
                <div key={campus} className="flex justify-between text-sm">
                  <span>{campus}</span>
                  <span className="font-medium text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Total Scores */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Total Scores by Grade */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scores by Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {totalScoresByGrade.map(([grade, totalScore]) => (
                <div key={grade} className="flex justify-between text-sm">
                  <span>{grade}</span>
                  <span className="font-medium text-muted-foreground">
                    {totalScore.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Total Scores by Campus */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scores by Campus
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {totalScoresByCampus.map(([campus, totalScore]) => (
                <div key={campus} className="flex justify-between text-sm">
                  <span>{campus}</span>
                  <span className="font-medium text-muted-foreground">
                    {totalScore.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Today's Scores */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Today's Scores by Grade */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Scores by Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {todayScoresByGrade.length > 0 ? (
                todayScoresByGrade.map(([grade, todayScore]) => (
                  <div key={grade} className="flex justify-between text-sm">
                    <span>{grade}</span>
                    <span className="font-medium text-muted-foreground">
                      {todayScore.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No scores today yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Scores by Campus */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Scores by Campus
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {todayScoresByCampus.length > 0 ? (
                todayScoresByCampus.map(([campus, todayScore]) => (
                  <div key={campus} className="flex justify-between text-sm">
                    <span>{campus}</span>
                    <span className="font-medium text-muted-foreground">
                      {todayScore.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No scores today yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
