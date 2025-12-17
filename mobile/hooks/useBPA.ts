import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completeBPAQuestion,
  completeBPAQuiz,
  fetchBPAChapterDetails,
  fetchBPALevels,
  fetchBPANovelDetails,
  fetchBPANovels,
  fetchBPARankings,
  fetchBPATimeframes,
  markBPAQuestionStarted,
} from "@/services/api/bpa";
import type {
  BPAChapterQuizData,
  BPALevelsResponse,
  BPANovelDetails,
  BPANovelFilterParams,
  BPANovelsResponse,
  BPAQuestionCompleteData,
  BPAQuestionCompletionResult,
  BPAQuestionStartData,
  BPAQuizCompleteData,
  BPAQuizCompletionResult,
  BPARankingsResponse,
  BPATimeframe,
  BPATimeframesResponse,
} from "@/types/bpa";

// Fetch all BPA levels with user progress
export function useBPALevels() {
  return useQuery<BPALevelsResponse>({
    queryKey: ["bpaLevels"],
    queryFn: fetchBPALevels,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

// Fetch novels for a specific BPA level
export function useBPANovels(levelId: string, params: BPANovelFilterParams = {}) {
  return useQuery<BPANovelsResponse>({
    queryKey: ["bpaNovels", levelId, params],
    queryFn: () => fetchBPANovels(levelId, params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!levelId,
    refetchOnWindowFocus: true,
  });
}

// Fetch BPA novel details with chapters
export function useBPANovelDetails(levelId: string, novelId: string) {
  return useQuery<BPANovelDetails>({
    queryKey: ["bpaNovelDetails", levelId, novelId],
    queryFn: () => fetchBPANovelDetails(levelId, novelId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!levelId && !!novelId,
    refetchOnWindowFocus: true,
  });
}

// Fetch BPA chapter details with questions for quiz
export function useBPAChapterDetails(
  levelId: string,
  novelId: string,
  chapterId: string,
  status?: string
) {
  return useQuery<BPAChapterQuizData>({
    queryKey: ["bpaChapterDetails", levelId, novelId, chapterId, status],
    queryFn: () => fetchBPAChapterDetails(levelId, novelId, chapterId, status),
    staleTime: 1000 * 60 * 1, // 1 minute - shorter for quiz data
    enabled: !!levelId && !!novelId && !!chapterId,
    refetchOnWindowFocus: false, // Don't refetch during quiz
  });
}

// Mark BPA question as started
export function useMarkBPAQuestionStarted() {
  return useMutation<
    { success: boolean; error?: string },
    Error,
    BPAQuestionStartData
  >({
    mutationFn: markBPAQuestionStarted,
  });
}

// Complete a BPA question with answer
export function useCompleteBPAQuestion() {
  const queryClient = useQueryClient();

  return useMutation<BPAQuestionCompletionResult, Error, BPAQuestionCompleteData>({
    mutationFn: completeBPAQuestion,
    onSuccess: () => {
      // Invalidate dashboard to update scores
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Invalidate BPA rankings to update leaderboards
      queryClient.invalidateQueries({ queryKey: ["bpaRankings"] });
    },
  });
}

// Save BPA quiz completion
export function useCompleteBPAQuiz() {
  const queryClient = useQueryClient();

  return useMutation<BPAQuizCompletionResult, Error, BPAQuizCompleteData>({
    mutationFn: completeBPAQuiz,
    onSuccess: (_, variables) => {
      // Invalidate relevant queries after quiz completion
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["bpaLevels"] });
      // Invalidate BPA rankings to update leaderboards
      queryClient.invalidateQueries({ queryKey: ["bpaRankings"] });
      queryClient.invalidateQueries({
        queryKey: ["bpaNovelDetails", variables.levelId, variables.novelId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "bpaChapterDetails",
          variables.levelId,
          variables.novelId,
          variables.chapterId,
        ],
      });
    },
  });
}

// Fetch BPA timeframes with semesters
export function useBPATimeframes() {
  return useQuery<BPATimeframesResponse>({
    queryKey: ["bpaTimeframes"],
    queryFn: fetchBPATimeframes,
    staleTime: 1000 * 60 * 10, // 10 minutes - timeframes don't change often
    refetchOnWindowFocus: false,
  });
}

// Fetch BPA rankings for a specific timeframe, season, and level
export function useBPARankings(
  timeframeId: string | null,
  season: "Spring" | "Summer" | "Fall" | "Winter",
  levelId: string | null
) {
  return useQuery<BPARankingsResponse>({
    queryKey: ["bpaRankings", timeframeId, season, levelId],
    queryFn: () => fetchBPARankings(timeframeId!, season, levelId!),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!timeframeId && !!levelId,
    refetchOnWindowFocus: true,
  });
}

// Helper hook to get current semester from timeframes
export function useCurrentSemester(
  timeframes: BPATimeframe[],
  selectedTimeframeId: string | null
) {
  if (!selectedTimeframeId || !timeframes.length) return null;

  const selectedTimeframe = timeframes.find((tf) => tf.id === selectedTimeframeId);
  if (!selectedTimeframe) return null;

  const now = new Date();
  const currentSemester = selectedTimeframe.semesters.find((semester) => {
    const start = new Date(semester.startDate);
    const end = new Date(semester.endDate);
    return now >= start && now <= end;
  });

  // If no current semester found, return the first one
  return currentSemester || selectedTimeframe.semesters[0] || null;
}

// Re-export types
export type {
  BPAChapterDetails,
  BPAChapterQuizData,
  BPAChapterStatus,
  BPAChapterTryData,
  BPALevel,
  BPALevelInfo,
  BPALevelsResponse,
  BPANextChapter,
  BPANovelDetails,
  BPANovelFilterParams,
  BPANovelListItem,
  BPANovelsResponse,
  BPAQuestion,
  BPAQuestionCompletionResult,
  BPAQuestionSet,
  BPAQuizCompletionResult,
  BPARanking,
  BPARankingsResponse,
  BPASeason,
  BPASemester,
  BPATimeframe,
  BPATimeframesResponse,
  BPAUnit,
} from "@/types/bpa";
