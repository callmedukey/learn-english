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

import type { CampusStudent } from "../queries/campus-leaderboard.query";

interface CampusLeaderboardTableProps {
  students: CampusStudent[];
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function CampusLeaderboardTable({
  students,
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
              <TableHead>Student Name</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead className="text-right">BPA Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  No student data available for the selected filters
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-bold">
                    <div className="flex items-center justify-center gap-1">
                      {student.rank}
                      {student.rank === 1 && <span className="text-xl">🥇</span>}
                      {student.rank === 2 && <span className="text-xl">🥈</span>}
                      {student.rank === 3 && <span className="text-xl">🥉</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {student.nickname || student.studentName || "Anonymous"}
                      </div>
                      {student.studentName && student.nickname && (
                        <div className="text-sm text-gray-500">
                          {student.studentName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.campus.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800">
                      {student.grade}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-amber-700">
                    {student.bpaScore.toLocaleString()}
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
            <p className="text-base text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, total)}
              </span>{" "}
              of <span className="font-medium">{total}</span> students
            </p>

            <div className="flex items-center gap-2">
              <label className="text-base text-gray-700">Per page:</label>
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
              className="rounded-md border border-gray-300 px-3 py-1 text-base font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className={`rounded-md px-3 py-1 text-base font-medium ${
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
              className="rounded-md border border-gray-300 px-3 py-1 text-base font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
