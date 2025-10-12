"use client";

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

import type { CampusRanking } from "../queries/campus-leaderboard.query";

interface CampusLeaderboardTableProps {
  campuses: CampusRanking[];
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function CampusLeaderboardTable({
  campuses,
  currentPage,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: CampusLeaderboardTableProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Campus Name</TableHead>
              <TableHead className="text-center">Students</TableHead>
              <TableHead className="text-right">Total Score</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  No campus data available for the selected filters
                </TableCell>
              </TableRow>
            ) : (
              campuses.map((campus) => (
                <TableRow key={campus.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-bold">
                    <div className="flex items-center justify-center gap-1">
                      {campus.rank}
                      {campus.rank === 1 && <span className="text-lg">🥇</span>}
                      {campus.rank === 2 && <span className="text-lg">🥈</span>}
                      {campus.rank === 3 && <span className="text-lg">🥉</span>}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{campus.name}</TableCell>
                  <TableCell className="text-center text-gray-700">
                    {campus.studentCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-amber-700">
                    {campus.totalScore.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                      View Students
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          {/* Left side - Results info and page size selector */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, total)}
              </span>{" "}
              of <span className="font-medium">{total}</span> campuses
            </p>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Per page:</label>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right side - Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {/* Show page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={`rounded-md px-3 py-1 text-sm font-medium ${
                      currentPage === pageNumber
                        ? "bg-primary text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
