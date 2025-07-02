import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { LeaderboardUser } from "../queries/leaderboard.query";

interface LeaderboardTableProps {
  users: LeaderboardUser[];
}

export default function LeaderboardTable({ users }: LeaderboardTableProps) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No users found for the selected criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead>AR Score</TableHead>
              <TableHead>RC Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {index + 1 <= 3 && (
                      <span className="mr-2 text-base">
                        {index + 1 === 1 && "🥇"}
                        {index + 1 === 2 && "🥈"}
                        {index + 1 === 3 && "🥉"}
                      </span>
                    )}
                    #{index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {user.nickname || user.name || "Anonymous"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                    {user.grade}
                  </span>
                </TableCell>
                <TableCell>{user.country?.name || "N/A"}</TableCell>
                <TableCell className="font-semibold">
                  {user.totalScore.toLocaleString()}
                </TableCell>
                <TableCell>{user.arScores.toLocaleString()}</TableCell>
                <TableCell>{user.rcScores.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
