"use client";

import { useQuery } from "@tanstack/react-query";

import { BPARanking, BPASemester } from "@/types/bpa.types";

/**
 * Fetch all BPA timeframes from the database
 */
async function fetchBPASemesters(): Promise<BPASemester[]> {
  try {
    const response = await fetch("/api/bpa/timeframes");
    if (!response.ok) {
      throw new Error("Failed to fetch BPA timeframes");
    }
    const data = await response.json();
    return data.timeframes;
  } catch (error) {
    console.error("Error fetching BPA timeframes:", error);
    return [];
  }
}

/**
 * Fetch BPA rankings for a specific timeframe, season, and level
 */
async function fetchBPARankings(
  timeframeId: string,
  season: "Spring" | "Summer" | "Fall" | "Winter",
  levelId: string,
): Promise<BPARanking[]> {
  try {
    const response = await fetch(
      `/api/bpa/rankings?timeframeId=${timeframeId}&season=${season}&levelId=${levelId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch BPA rankings");
    }
    const data = await response.json();
    return data.rankings;
  } catch (error) {
    console.error("Error fetching BPA rankings:", error);
    return [];
  }
}

export function useBPASemesters() {
  return useQuery({
    queryKey: ["bpa-semesters"],
    queryFn: fetchBPASemesters,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBPARankings(
  timeframeId: string | null,
  season: "Spring" | "Summer" | "Fall" | "Winter",
  levelId: string
) {
  return useQuery({
    queryKey: ["bpa-rankings", timeframeId, season, levelId],
    queryFn: () => fetchBPARankings(timeframeId!, season, levelId),
    enabled: !!timeframeId && !!levelId, // Only fetch when timeframe and level are selected
    staleTime: 60 * 1000, // 1 minute
  });
}
