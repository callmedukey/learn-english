"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import LeaderboardTable from "./leaderboard-table";
import { LeaderboardResult } from "../queries/leaderboard.query";

interface GradeLeaderboardProps {
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
  gradeData: LeaderboardResult;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const GRADE_OPTIONS = [
  { value: "Kinder", label: "Kinder" },
  { value: "Grade 1", label: "Grade 1" },
  { value: "Grade 2", label: "Grade 2" },
  { value: "Grade 3", label: "Grade 3" },
  { value: "Grade 4", label: "Grade 4" },
  { value: "Grade 5", label: "Grade 5" },
  { value: "Grade 6", label: "Grade 6" },
  { value: "Grade 7", label: "Grade 7" },
  { value: "Grade 8", label: "Grade 8" },
  { value: "Grade 9", label: "Grade 9" },
  { value: "Grade 10", label: "Grade 10" },
  { value: "Grade 11", label: "Grade 11" },
  { value: "Grade 12", label: "Grade 12" },
  { value: "Adult", label: "Adult" },
];

export default function GradeLeaderboard({
  selectedGrade,
  onGradeChange,
  gradeData,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: GradeLeaderboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label htmlFor="grade-selector" className="text-sm font-medium">
          Select Grade:
        </label>
        <Select value={selectedGrade} onValueChange={onGradeChange}>
          <SelectTrigger id="grade-selector" className="w-[200px]">
            <SelectValue placeholder="Select a grade" />
          </SelectTrigger>
          <SelectContent>
            {GRADE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {gradeData.total} student{gradeData.total !== 1 ? "s" : ""} in {selectedGrade}
        </p>
      </div>

      <LeaderboardTable
        users={gradeData.users}
        currentPage={currentPage}
        pageSize={pageSize}
        total={gradeData.total}
        totalPages={gradeData.totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
