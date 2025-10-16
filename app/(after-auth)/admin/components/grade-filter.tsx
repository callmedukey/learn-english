"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GradeFilterProps {
  selectedGrade: string | null;
  onGradeChange: (grade: string | null) => void;
}

const GRADE_OPTIONS = [
  { value: "all", label: "All Grades" },
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

export default function GradeFilter({
  selectedGrade,
  onGradeChange,
}: GradeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="grade-filter" className="text-base font-medium">
        Grade:
      </label>
      <Select
        value={selectedGrade || "all"}
        onValueChange={(value) => onGradeChange(value === "all" ? null : value)}
      >
        <SelectTrigger id="grade-filter" className="w-[180px]">
          <SelectValue placeholder="Select grade" />
        </SelectTrigger>
        <SelectContent>
          {GRADE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
