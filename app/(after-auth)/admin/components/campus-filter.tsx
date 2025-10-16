"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampusFilterProps {
  campuses: { id: string; name: string }[];
  selectedCampus: string | null;
  onCampusChange: (campusId: string | null) => void;
}

export default function CampusFilter({
  campuses,
  selectedCampus,
  onCampusChange,
}: CampusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="campus-select" className="text-base font-medium">
        Filter by Campus:
      </label>
      <Select
        value={selectedCampus || "all"}
        onValueChange={(value) =>
          onCampusChange(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Campuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Campuses</SelectItem>
          {campuses.map((campus) => (
            <SelectItem key={campus.id} value={campus.id}>
              {campus.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
