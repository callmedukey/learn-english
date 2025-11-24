"use client";

import { LayoutGrid, Square } from "lucide-react";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { BPALevelCard } from "./bpa-level-card";
import { BPASemesterExpanded } from "./bpa-semester-expanded";
import { BPASemesterLeaderboard } from "./bpa-semester-leaderboard";
import { BPASemesterSelector } from "./bpa-semester-selector";
import {
  useCurrentSemester,
  useBPASemesters,
  useSemesterViewMode,
} from "./queries/bpa.query";

interface BPAPageContentProps {
  userLevelAssignments: Record<string, Record<string, string>>; // { [timeframeId]: { Spring: "lv2", Summer: "lv3", ... } }
  bpaLevels: Array<{
    id: string;
    name: string;
    description: string | null;
    stars: number;
    novelsAvailable: number;
  }>;
}

export function BPAPageContent({
  userLevelAssignments,
  bpaLevels,
}: BPAPageContentProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);
  const { data: timeframes } = useBPASemesters();
  const [viewMode, setViewMode] = useSemesterViewMode();
  const currentSemester = useCurrentSemester(timeframes || [], selectedTimeframe);

  // Auto-select the ACTIVE timeframe when data loads
  useEffect(() => {
    if (timeframes && timeframes.length > 0 && !selectedTimeframe) {
      // Find the active timeframe
      const activeTimeframe = timeframes.find((tf) => tf.isActive);

      if (activeTimeframe) {
        setSelectedTimeframe(activeTimeframe.id);
      } else {
        // Fallback to latest if none are marked active
        const latestTimeframe = timeframes.reduce((latest, current) => {
          const latestDate = new Date(latest.startDate);
          const currentDate = new Date(current.startDate);
          return currentDate > latestDate ? current : latest;
        });
        setSelectedTimeframe(latestTimeframe.id);
      }
    }
  }, [timeframes, selectedTimeframe]);

  // Convert season from UPPERCASE to Title case for display
  const formatSeasonName = (season: string): "Spring" | "Summer" | "Fall" | "Winter" => {
    const formatted = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
    return formatted as "Spring" | "Summer" | "Fall" | "Winter";
  };

  return (
    <div className="py-16">
      {/* Page Title */}
      <div className="mb-12 flex items-center gap-3">
        <h1 className="text-4xl font-bold text-amber-900">BPA CHALLENGE</h1>
        <Trophy className="h-8 w-8 text-primary" />
      </div>

      {/* Semester Leaderboards - Single or 2x2 Grid with Timeframe Selector */}
      <div className="mb-16">
        {/* Timeframe Selector and View Toggle */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("single")}
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Current Semester
            </Button>
            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("all")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              All Semesters
            </Button>
          </div>
          <BPASemesterSelector
            value={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
          />
        </div>

        {/* Conditional Rendering based on View Mode */}
        {viewMode === "single" && currentSemester ? (
          /* Single Semester View - Expanded */
          <BPASemesterExpanded
            season={formatSeasonName(currentSemester.season)}
            timeframeId={selectedTimeframe}
            defaultLevel={
              selectedTimeframe
                ? userLevelAssignments[selectedTimeframe]?.[
                    formatSeasonName(currentSemester.season)
                  ]
                : undefined
            }
            bpaLevels={bpaLevels.map((level) => ({
              id: level.id,
              name: level.name,
            }))}
          />
        ) : (
          /* All Semesters View - 2x2 Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <BPASemesterLeaderboard
              season="Spring"
              timeframeId={selectedTimeframe}
              defaultLevel={
                selectedTimeframe
                  ? userLevelAssignments[selectedTimeframe]?.Spring
                  : undefined
              }
              bpaLevels={bpaLevels.map((level) => ({
                id: level.id,
                name: level.name,
              }))}
            />
            <BPASemesterLeaderboard
              season="Summer"
              timeframeId={selectedTimeframe}
              defaultLevel={
                selectedTimeframe
                  ? userLevelAssignments[selectedTimeframe]?.Summer
                  : undefined
              }
              bpaLevels={bpaLevels.map((level) => ({
                id: level.id,
                name: level.name,
              }))}
            />
            <BPASemesterLeaderboard
              season="Fall"
              timeframeId={selectedTimeframe}
              defaultLevel={
                selectedTimeframe
                  ? userLevelAssignments[selectedTimeframe]?.Fall
                  : undefined
              }
              bpaLevels={bpaLevels.map((level) => ({
                id: level.id,
                name: level.name,
              }))}
            />
            <BPASemesterLeaderboard
              season="Winter"
              timeframeId={selectedTimeframe}
              defaultLevel={
                selectedTimeframe
                  ? userLevelAssignments[selectedTimeframe]?.Winter
                  : undefined
              }
              bpaLevels={bpaLevels.map((level) => ({
                id: level.id,
                name: level.name,
              }))}
            />
          </div>
        )}
      </div>

      {/* Level Selection Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-amber-900">
          Choose your BPA LEVEL
        </h2>
      </div>

      {/* Level Cards - 3x2 Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bpaLevels.map((level) => (
          <BPALevelCard key={level.id} level={level} />
        ))}
      </div>
    </div>
  );
}
