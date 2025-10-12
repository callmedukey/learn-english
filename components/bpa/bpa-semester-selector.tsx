"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBPASemesters } from "./queries/bpa.query";

interface BPASemesterSelectorProps {
  value: string | null;
  onValueChange: (value: string) => void;
}

export function BPASemesterSelector({
  value,
  onValueChange,
}: BPASemesterSelectorProps) {
  const { data: semesters, isLoading } = useBPASemesters();

  if (isLoading) {
    return (
      <div className="flex h-9 w-64 items-center justify-center rounded-sm border border-input bg-transparent px-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select semester..." />
      </SelectTrigger>
      <SelectContent>
        {semesters?.map((semester) => (
          <SelectItem key={semester.id} value={semester.id}>
            {semester.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
