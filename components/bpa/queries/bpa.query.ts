"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getCurrentSemester, SemesterWithDates } from "@/lib/utils/bpa-semester";
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

/**
 * Hook to determine the current active semester for a given timeframe
 */
export function useCurrentSemester(
  timeframes: BPASemester[],
  timeframeId: string | null
): SemesterWithDates | null {
  const [currentSemester, setCurrentSemester] = useState<SemesterWithDates | null>(null);

  useEffect(() => {
    if (!timeframeId || !timeframes || timeframes.length === 0) {
      setCurrentSemester(null);
      return;
    }

    // Find the selected timeframe
    const timeframe = timeframes.find((tf) => tf.id === timeframeId);
    if (!timeframe || !timeframe.semesters || timeframe.semesters.length === 0) {
      setCurrentSemester(null);
      return;
    }

    // Get current semester based on dates
    const semester = getCurrentSemester(timeframe.semesters);
    setCurrentSemester(semester);
  }, [timeframes, timeframeId]);

  return currentSemester;
}

type ViewMode = "single" | "all";
const VIEW_MODE_KEY = "bpa-view-mode";

/**
 * Hook to manage semester view mode with localStorage persistence
 */
export function useSemesterViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>("single");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      if (stored === "single" || stored === "all") {
        setViewMode(stored);
      }
    } catch (error) {
      console.error("Error reading view mode from localStorage:", error);
    }
  }, []);

  // Update function that also persists to localStorage
  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch (error) {
      console.error("Error saving view mode to localStorage:", error);
    }
  };

  return [viewMode, updateViewMode];
}
