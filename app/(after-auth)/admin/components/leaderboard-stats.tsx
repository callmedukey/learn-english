import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LeaderboardUser } from "../queries/leaderboard.query";

interface LeaderboardStatsProps {
  users: LeaderboardUser[];
}

export default function LeaderboardStats({ users }: LeaderboardStatsProps) {
  const totalUsers = users.length;
  const totalScore = users.reduce((sum, user) => sum + user.totalScore, 0);
  const averageScore = totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0;

  // Count users by grade
  const gradeDistribution = users.reduce(
    (acc, user) => {
      acc[user.grade] = (acc[user.grade] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Count users by country
  const countryDistribution = users.reduce(
    (acc, user) => {
      const countryName = user.country?.name || "Unknown";
      acc[countryName] = (acc[countryName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCountries = Object.entries(countryDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topGrades = Object.entries(gradeDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
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

      {/* Average Score */}
      <Card>
        <CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Average Score
          </p>
          <p className="text-2xl font-semibold">
            {averageScore.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Top Countries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Countries
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
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

      {/* Top Grades */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Grades
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
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
    </div>
  );
}
