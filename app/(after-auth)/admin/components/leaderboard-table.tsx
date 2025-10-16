import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ScoreLogDialog from "./score-log-dialog";
import { LeaderboardUser } from "../queries/leaderboard.query";

interface LeaderboardTableProps {
  users: LeaderboardUser[];
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function LeaderboardTable({
  users,
  currentPage,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: LeaderboardTableProps) {
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

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Current Level</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead>Lexile Score</TableHead>
              <TableHead>RC Score</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {user.rank <= 3 && (
                        <span className="mr-2 text-lg">
                          {user.rank === 1 && "🥇"}
                          {user.rank === 2 && "🥈"}
                          {user.rank === 3 && "🥉"}
                        </span>
                      )}
                      #{user.rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.nickname || user.name || "Anonymous"}
                      </div>
                      <div className="text-base text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.studentName || "N/A"}</TableCell>
                  <TableCell>
                    {user.currentBPALevel ? (
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-sm font-semibold text-purple-800">
                        {user.currentBPALevel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not Assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800">
                      {user.grade}
                    </span>
                  </TableCell>
                  <TableCell>{user.country?.name || "N/A"}</TableCell>
                  <TableCell>{user.campus?.name || "N/A"}</TableCell>
                  <TableCell className="font-semibold">
                    {user.totalScore.toLocaleString()}
                  </TableCell>
                  <TableCell>{user.arScores.toLocaleString()}</TableCell>
                  <TableCell>{user.rcScores.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <ScoreLogDialog
                      userId={user.id}
                      userNickname={user.nickname || user.name || "Anonymous"}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Pagination controls */}
        <div className="flex flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="text-base text-muted-foreground">
              Showing {startIndex} to {endIndex} of {total} results
            </p>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground">Show:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => {
                if (page === "...") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-base text-muted-foreground"
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
