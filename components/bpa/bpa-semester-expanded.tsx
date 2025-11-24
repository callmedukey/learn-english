"use client";

import { Crown } from "lucide-react";
import { useEffect, useState } from "react";

import { UserStatsPopover } from "@/components/leaderboard/user-stats-popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useBPARankings } from "./queries/bpa.query";

interface BPALevelOption {
  id: string;
  name: string;
}

interface BPASemesterExpandedProps {
  season: "Spring" | "Summer" | "Fall" | "Winter";
  timeframeId: string | null;
  defaultLevel?: string; // User's assigned level ID for this season
  bpaLevels: BPALevelOption[]; // Available BPA levels
}

export function BPASemesterExpanded({
  season,
  timeframeId,
  defaultLevel,
  bpaLevels,
}: BPASemesterExpandedProps) {
  // Find the initial level index
  const initialLevelIndex = defaultLevel
    ? bpaLevels.findIndex((level) => level.id === defaultLevel)
    : 0;
  const validInitialIndex = initialLevelIndex >= 0 ? initialLevelIndex : 0;

  // State to track current level
  const [currentLevelIndex, setCurrentLevelIndex] = useState(validInitialIndex);
  const currentLevel = bpaLevels[currentLevelIndex];

  // Reset to defaultLevel when timeframeId or defaultLevel changes
  useEffect(() => {
    if (defaultLevel) {
      const newIndex = bpaLevels.findIndex((level) => level.id === defaultLevel);
      if (newIndex >= 0) {
        setCurrentLevelIndex(newIndex);
      }
    }
  }, [defaultLevel, timeframeId, bpaLevels]);

  const handleTabChange = (value: string) => {
    const index = bpaLevels.findIndex((level) => level.id === value);
    if (index >= 0) {
      setCurrentLevelIndex(index);
    }
  };

  return (
    <Card className="w-full gap-0 bg-white py-0 shadow-lg">
      <CardHeader className="rounded-t-lg bg-primary text-white">
        <CardTitle className="py-2 text-center text-2xl font-bold">
          {season} Semester
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs
          value={currentLevel?.id || ""}
          onValueChange={handleTabChange}
          className="w-full"
        >
          {/* Level Tabs */}
          <TabsList
            className="w-full rounded-none bg-gray-200 grid"
            style={{
              gridTemplateColumns: `repeat(${bpaLevels.length}, minmax(0, 1fr))`,
            }}
          >
            {bpaLevels.map((level) => (
              <TabsTrigger
                key={level.id}
                value={level.id}
                className="font-semibold data-[state=active]:bg-white data-[state=active]:text-primary"
              >
                {level.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {bpaLevels.map((level) => (
            <TabsContent key={level.id} value={level.id} className="mt-0">
              <ExpandedRankingDisplay
                timeframeId={timeframeId}
                season={season}
                levelId={level.id}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ExpandedRankingDisplayProps {
  timeframeId: string | null;
  season: "Spring" | "Summer" | "Fall" | "Winter";
  levelId: string;
}

function ExpandedRankingDisplay({
  timeframeId,
  season,
  levelId,
}: ExpandedRankingDisplayProps) {
  const {
    data: rankings,
    isLoading,
    isError,
  } = useBPARankings(timeframeId, season, levelId);

  return (
    <div className="flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center gap-6 px-4 pb-4 text-sm font-semibold text-gray-600">
        <div className="w-16 text-center">RANK</div>
        <div className="flex min-w-0 flex-1">NICKNAME</div>
        <div className="w-20 text-center">GRADE</div>
        <div className="w-24 text-right">POINT</div>
      </div>

      {/* Rankings with scrollable container */}
      <ScrollArea className="h-[32rem] w-full">
        <div className="relative">
          {/* Initial loading state - no timeframe selected */}
          {!timeframeId && (
            <div className="flex h-[32rem] items-center justify-center text-center text-base text-gray-500">
              Please select a timeframe to view rankings
            </div>
          )}

          {/* Full loading state - first load */}
          {timeframeId && isLoading && !rankings && (
            <div className="flex h-[32rem] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          )}

          {/* Error state */}
          {timeframeId && isError && (
            <div className="flex h-[32rem] items-center justify-center text-center text-base text-destructive">
              Failed to load rankings. Please try again.
            </div>
          )}

          {/* Content with overlay loading state */}
          {timeframeId && rankings && (
            <>
              {/* Loading overlay - only during refetch */}
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              )}

              {/* Content */}
              <div
                className={`space-y-2 transition-opacity duration-200 ${isLoading ? "opacity-60" : "opacity-100"}`}
              >
                {rankings.length === 0 ? (
                  <div className="flex h-[32rem] items-center justify-center text-center text-base text-gray-500">
                    No rankings available
                  </div>
                ) : (
                  <>
                    {rankings.map((item) => (
                      <UserStatsPopover key={item.id} userId={item.id}>
                        <div className="flex items-center gap-6 rounded-lg p-4 transition-colors hover:bg-gray-50">
                          {/* Rank */}
                          <div className="flex w-16 items-center justify-center">
                            <span className="text-xl font-bold text-gray-600">
                              {item.rank}
                            </span>
                          </div>

                          {/* User Info */}
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            {/* Nickname with Crown and Campus */}
                            <div className="flex min-w-0 flex-col gap-1">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className={`truncate text-lg font-medium ${item.campusId ? "text-primary" : "text-gray-900"}`}
                                >
                                  {item.nickname}
                                </span>
                                {item.rank === 1 && (
                                  <Crown className="h-5 w-5 flex-shrink-0 fill-amber-400 text-amber-400" />
                                )}
                                {item.rank === 2 && (
                                  <Crown className="h-5 w-5 flex-shrink-0 fill-gray-400 text-gray-400" />
                                )}
                                {item.rank === 3 && (
                                  <Crown className="h-5 w-5 flex-shrink-0 fill-amber-700 text-amber-700" />
                                )}
                              </div>
                              {item.campusName && (
                                <span className="truncate text-sm text-primary">
                                  {item.campusName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Grade */}
                          <div className="w-20 text-center text-base font-semibold whitespace-nowrap text-gray-700">
                            {item.grade}
                          </div>

                          {/* Score */}
                          <div className="w-24 text-right text-lg font-bold text-amber-700">
                            {item.score.toLocaleString()}
                          </div>
                        </div>
                      </UserStatsPopover>
                    ))}

                    {/* Fill empty slots only up to 5 if less than 5 rankings */}
                    {rankings.length < 5 &&
                      Array.from({ length: 5 - rankings.length }, (_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="flex items-center gap-6 p-4 opacity-30"
                        >
                          <div className="w-16 text-center text-xl font-bold text-gray-400">
                            {rankings.length + i + 1}
                          </div>
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="text-lg text-gray-400">-</div>
                          </div>
                          <div className="w-20 text-center text-base text-gray-400">
                            -
                          </div>
                          <div className="w-24 text-right text-lg text-gray-400">-</div>
                        </div>
                      ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
