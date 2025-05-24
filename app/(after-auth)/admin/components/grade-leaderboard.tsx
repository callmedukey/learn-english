import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LeaderboardUser } from "../queries/leaderboard.query";

interface GradeLeaderboardProps {
  users: LeaderboardUser[];
}

export default function GradeLeaderboard({ users }: GradeLeaderboardProps) {
  // Group users by grade
  const usersByGrade = users.reduce(
    (acc, user) => {
      if (!acc[user.grade]) {
        acc[user.grade] = [];
      }
      acc[user.grade].push(user);
      return acc;
    },
    {} as Record<string, LeaderboardUser[]>,
  );

  // Sort grades and get top 3 users per grade
  const sortedGrades = Object.keys(usersByGrade).sort((a, b) => {
    // Custom sorting for grades
    const gradeOrder = [
      "Below Grade 1",
      "Grade 1",
      "Grade 2",
      "Grade 3",
      "Grade 4",
      "Grade 5",
      "Grade 6",
      "Grade 7",
      "Grade 8",
      "Grade 9",
      "Grade 10",
      "Grade 11",
      "Grade 12",
      "Adult",
      "N/A",
    ];

    const indexA = gradeOrder.indexOf(a);
    const indexB = gradeOrder.indexOf(b);

    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  if (sortedGrades.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No grade data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedGrades.map((grade) => {
        const gradeUsers = usersByGrade[grade]
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3); // Top 3 per grade

        return (
          <Card key={grade}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{grade}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {usersByGrade[grade].length} student
                {usersByGrade[grade].length !== 1 ? "s" : ""}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {gradeUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      {index === 0 && <span>🥇</span>}
                      {index === 1 && <span>🥈</span>}
                      {index === 2 && <span>🥉</span>}
                      <div>
                        <p className="text-sm font-medium">
                          {user.nickname || user.name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.country?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {user.totalScore.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        AR: {user.arScores} | RC: {user.rcScores}
                      </p>
                    </div>
                  </div>
                ))}
                {gradeUsers.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No students with scores yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
