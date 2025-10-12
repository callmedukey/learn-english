"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BPASemester {
  id: string;
  season: "SPRING" | "SUMMER" | "FALL" | "WINTER";
  startDate: Date;
  endDate: Date;
}

interface BPATimeframe {
  id: string;
  year: number;
  startDate: Date;
  endDate: Date;
  semesters: BPASemester[];
}

interface SemesterSelectorProps {
  timeframes: BPATimeframe[];
  selectedTimeframeId: string | null;
  selectedSemesterId: string | null;
  onTimeframeChange: (timeframeId: string) => void;
  onSemesterChange: (semesterId: string, season: string) => void;
}

const SEASON_DISPLAY: Record<string, string> = {
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
  WINTER: "Winter",
};

const SEASON_ORDER = ["SPRING", "SUMMER", "FALL", "WINTER"];

export default function SemesterSelector({
  timeframes,
  selectedTimeframeId,
  selectedSemesterId,
  onTimeframeChange,
  onSemesterChange,
}: SemesterSelectorProps) {
  const selectedTimeframe = timeframes.find((t) => t.id === selectedTimeframeId);

  // Sort semesters by season order
  const sortedSemesters = selectedTimeframe
    ? [...selectedTimeframe.semesters].sort(
        (a, b) => SEASON_ORDER.indexOf(a.season) - SEASON_ORDER.indexOf(b.season)
      )
    : [];

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  };

  return (
    <div className="space-y-4">
      {/* Timeframe Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="timeframe-select" className="text-sm font-medium">
          Timeframe:
        </label>
        <Select
          value={selectedTimeframeId || undefined}
          onValueChange={onTimeframeChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            {timeframes.map((timeframe) => (
              <SelectItem key={timeframe.id} value={timeframe.id}>
                {timeframe.year} ({formatDateRange(timeframe.startDate, timeframe.endDate)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Semester Tabs */}
      {selectedTimeframe && sortedSemesters.length > 0 && (
        <Tabs
          value={selectedSemesterId || sortedSemesters[0].id}
          onValueChange={(semesterId) => {
            const semester = sortedSemesters.find((s) => s.id === semesterId);
            if (semester) {
              onSemesterChange(semesterId, semester.season);
            }
          }}
          className="w-full"
        >
          <TabsList
            className="grid h-auto w-full rounded-none border-b border-gray-200 bg-transparent p-0"
            style={{ gridTemplateColumns: `repeat(${sortedSemesters.length}, minmax(0, 1fr))` }}
          >
            {sortedSemesters.map((semester) => (
              <TabsTrigger
                key={semester.id}
                value={semester.id}
                className="relative rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <div className="flex flex-col items-center">
                  <span className="font-semibold">{SEASON_DISPLAY[semester.season]}</span>
                  <span className="text-xs text-gray-500">
                    {formatDateRange(semester.startDate, semester.endDate)}
                  </span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedSemesters.map((semester) => (
            <TabsContent key={semester.id} value={semester.id} className="mt-0">
              {/* Content will be rendered by parent */}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {!selectedTimeframe && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
          Please select a timeframe to view semesters
        </div>
      )}
    </div>
  );
}
