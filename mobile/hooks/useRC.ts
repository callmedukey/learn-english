import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completeRCQuestion,
  completeRCQuiz,
  fetchRCKeywords,
  fetchRCLevels,
  fetchRCQuizData,
  markRCQuestionStarted,
} from "@/services/api/rc";
import type {
  QuestionCompleteData,
  QuestionCompletionResult,
  QuestionStartData,
  QuizCompleteData,
  QuizCompletionResult,
  RCFilterParams,
  RCKeywordsResponse,
  RCLevelsResponse,
  RCQuizData,
} from "@/types/rc";

// Fetch all RC levels with user progress
export function useRCLevels() {
  return useQuery<RCLevelsResponse>({
    queryKey: ["rcLevels"],
    queryFn: fetchRCLevels,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

// Fetch keywords for a specific RC level
export function useRCKeywords(rcLevelId: string, params: RCFilterParams = {}) {
  return useQuery<RCKeywordsResponse>({
    queryKey: ["rcKeywords", rcLevelId, params],
    queryFn: () => fetchRCKeywords(rcLevelId, params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!rcLevelId,
    refetchOnWindowFocus: true,
  });
}

// Fetch quiz data for a specific keyword
export function useRCQuizData(
  rcLevelId: string,
  keywordId: string,
  status?: string
) {
  return useQuery<RCQuizData>({
    queryKey: ["rcQuizData", rcLevelId, keywordId, status],
    queryFn: () => fetchRCQuizData(rcLevelId, keywordId, status),
    staleTime: 1000 * 60 * 1, // 1 minute - shorter for quiz data
    enabled: !!rcLevelId && !!keywordId,
    refetchOnWindowFocus: false, // Don't refetch during quiz
  });
}

// Mark question as started
export function useMarkRCQuestionStarted() {
  return useMutation<
    { success: boolean; error?: string },
    Error,
    QuestionStartData
  >({
    mutationFn: markRCQuestionStarted,
  });
}

// Complete a question with answer
export function useCompleteRCQuestion() {
  const queryClient = useQueryClient();

  return useMutation<QuestionCompletionResult, Error, QuestionCompleteData>({
    mutationFn: completeRCQuestion,
    onSuccess: () => {
      // Invalidate dashboard to update scores
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Save quiz completion
export function useCompleteRCQuiz() {
  const queryClient = useQueryClient();

  return useMutation<QuizCompletionResult, Error, QuizCompleteData>({
    mutationFn: completeRCQuiz,
    onSuccess: (_, variables) => {
      // Invalidate relevant queries after quiz completion
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["rcLevels"] });
      queryClient.invalidateQueries({
        queryKey: ["rcKeywords", variables.rcLevelId],
      });
      queryClient.invalidateQueries({
        queryKey: ["rcQuizData", variables.rcLevelId, variables.keywordId],
      });
    },
  });
}

// Re-export types
export type {
  MedalImage,
  PaginationInfo,
  QuestionCompletionResult,
  QuizCompletionResult,
  RCFilterParams,
  RCKeyword,
  RCKeywordsResponse,
  RCLevel,
  RCLevelInfo,
  RCLevelsResponse,
  RCQuestion,
  RCQuestionSet,
  RCQuizData,
  RCQuizStatus,
  TryData,
} from "@/types/rc";
