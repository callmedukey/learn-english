"use client";

import { Crown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useBPARankings } from "./queries/bpa.query";

interface BPALevelOption {
  id: string;
  name: string;
}

interface BPASemesterLeaderboardProps {
  season: "Spring" | "Summer" | "Fall" | "Winter";
  timeframeId: string | null;
  defaultLevel?: string; // User's assigned level ID for this season
  bpaLevels: BPALevelOption[]; // Available BPA levels
}

export function BPASemesterLeaderboard({
  season,
  timeframeId,
  defaultLevel,
  bpaLevels,
}: BPASemesterLeaderboardProps) {
  // Determine the initial tab value: user's assigned level or default to first level
  const initialLevel = defaultLevel || (bpaLevels.length > 0 ? bpaLevels[0].id : "");

  return (
    <Card className="h-full gap-0 bg-white py-0 shadow-lg">
      <CardHeader className="rounded-t-lg bg-primary text-white">
        <CardTitle className="py-1 text-center text-lg font-semibold">
          {season} Semester
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue={initialLevel} className="w-full">
          <TabsList
            className="grid w-full rounded-none bg-gray-200"
            style={{ gridTemplateColumns: `repeat(${bpaLevels.length}, minmax(0, 1fr))` }}
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
              <RankingDisplay timeframeId={timeframeId} season={season} levelId={level.id} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface RankingDisplayProps {
  timeframeId: string | null;
  season: "Spring" | "Summer" | "Fall" | "Winter";
  levelId: string;
}

function RankingDisplay({ timeframeId, season, levelId }: RankingDisplayProps) {
  const { data: rankings, isLoading, isError } = useBPARankings(timeframeId, season, levelId);

  return (
    <div className="flex flex-col p-2">
      {/* Header */}
      <div className="flex items-center gap-4 px-2 pb-2 text-xs font-semibold text-gray-600">
        <div className="w-6"></div> {/* Rank column */}
        <div className="flex min-w-0 flex-1">NICKNAME</div>
        <div className="w-12 text-center">GRADE</div>
        <div className="w-16 text-right">POINT</div>
      </div>

      {/* Rankings with scrollable container */}
      <ScrollArea className="h-[20rem] w-full">
        <div className="relative">
          {/* Initial loading state - no timeframe selected */}
          {!timeframeId && (
            <div className="flex h-[20rem] items-center justify-center text-center text-sm text-gray-500">
              Please select a timeframe to view rankings
            </div>
          )}

          {/* Full loading state - first load */}
          {timeframeId && isLoading && !rankings && (
            <div className="flex h-[20rem] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          )}

          {/* Error state */}
          {timeframeId && isError && (
            <div className="flex h-[20rem] items-center justify-center text-center text-sm text-destructive">
              Failed to load rankings. Please try again.
            </div>
          )}

          {/* Content with overlay loading state */}
          {timeframeId && rankings && (
            <>
              {/* Loading overlay - only during refetch */}
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              )}

              {/* Content */}
              <div
                className={`space-y-2 transition-opacity duration-200 ${isLoading ? "opacity-60" : "opacity-100"}`}
              >
                {rankings.length === 0 ? (
                  <div className="flex h-[20rem] items-center justify-center text-center text-gray-500">
                    No rankings available
                  </div>
                ) : (
                  <>
                    {rankings.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-gray-50"
                      >
                        {/* Rank */}
                        <div className="flex w-6 items-center justify-center">
                          <span className="font-bold text-gray-600">
                            {item.rank}
                          </span>
                        </div>

                        {/* User Info */}
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          {/* Nickname with Crown */}
                          <div className="flex min-w-0 items-center gap-1">
                            <span className="truncate font-medium text-gray-900">
                              {item.nickname}
                            </span>
                            {item.rank === 1 && (
                              <Crown className="h-4 w-4 flex-shrink-0 fill-amber-400 text-amber-400" />
                            )}
                            {item.rank === 2 && (
                              <Crown className="h-4 w-4 flex-shrink-0 fill-gray-400 text-gray-400" />
                            )}
                            {item.rank === 3 && (
                              <Crown className="h-4 w-4 flex-shrink-0 fill-amber-700 text-amber-700" />
                            )}
                          </div>
                        </div>

                        {/* Grade */}
                        <div className="w-12 whitespace-nowrap text-center font-semibold text-gray-700">
                          {item.grade}
                        </div>

                        {/* Score */}
                        <div className="w-16 text-right font-bold text-amber-700">
                          {item.score.toLocaleString()}
                        </div>
                      </div>
                    ))}

                    {/* Fill empty slots only up to 5 if less than 5 rankings */}
                    {rankings.length < 5 &&
                      Array.from({ length: 5 - rankings.length }, (_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="flex items-center gap-4 p-2 opacity-30"
                        >
                          <div className="w-6 text-center font-bold text-gray-400">
                            {rankings.length + i + 1}
                          </div>
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <div className="text-gray-400">-</div>
                          </div>
                          <div className="w-12 text-center text-gray-400">-</div>
                          <div className="w-16 text-right text-gray-400">-</div>
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
