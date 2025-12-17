import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completeQuestion,
  completeQuiz,
  fetchARLevels,
  fetchChapterDetails,
  fetchNovelDetails,
  fetchNovels,
  markQuestionStarted,
} from "@/services/api/novel";
import type {
  ARLevelsResponse,
  ChapterQuizData,
  NovelDetails,
  NovelFilterParams,
  NovelsResponse,
  QuestionCompleteData,
  QuestionCompletionResult,
  QuestionStartData,
  QuizCompleteData,
  QuizCompletionResult,
} from "@/types/novel";

// Fetch all AR levels with user progress
export function useARLevels() {
  return useQuery<ARLevelsResponse>({
    queryKey: ["arLevels"],
    queryFn: fetchARLevels,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

// Fetch novels for a specific AR level
export function useNovels(arId: string, params: NovelFilterParams = {}) {
  return useQuery<NovelsResponse>({
    queryKey: ["novels", arId, params],
    queryFn: () => fetchNovels(arId, params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!arId,
    refetchOnWindowFocus: true,
  });
}

// Fetch novel details with chapters
export function useNovelDetails(arId: string, novelId: string) {
  return useQuery<NovelDetails>({
    queryKey: ["novelDetails", arId, novelId],
    queryFn: () => fetchNovelDetails(arId, novelId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!arId && !!novelId,
    refetchOnWindowFocus: true,
  });
}

// Fetch chapter details with questions for quiz
export function useChapterDetails(
  arId: string,
  novelId: string,
  chapterId: string
) {
  return useQuery<ChapterQuizData>({
    queryKey: ["chapterDetails", arId, novelId, chapterId],
    queryFn: () => fetchChapterDetails(arId, novelId, chapterId),
    staleTime: 1000 * 60 * 1, // 1 minute - shorter for quiz data
    enabled: !!arId && !!novelId && !!chapterId,
    refetchOnWindowFocus: false, // Don't refetch during quiz
  });
}

// Mark question as started
export function useMarkQuestionStarted() {
  return useMutation<{ success: boolean; error?: string }, Error, QuestionStartData>({
    mutationFn: markQuestionStarted,
  });
}

// Complete a question with answer
export function useCompleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation<QuestionCompletionResult, Error, QuestionCompleteData>({
    mutationFn: completeQuestion,
    onSuccess: () => {
      // Invalidate dashboard to update scores
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Save quiz completion
export function useCompleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation<QuizCompletionResult, Error, QuizCompleteData>({
    mutationFn: completeQuiz,
    onSuccess: (_, variables) => {
      // Invalidate relevant queries after quiz completion
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["arLevels"] });
      queryClient.invalidateQueries({
        queryKey: ["novelDetails", variables.arId, variables.novelId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "chapterDetails",
          variables.arId,
          variables.novelId,
          variables.chapterId,
        ],
      });
    },
  });
}

// Re-export types
export type {
  ARLevel,
  ARLevelsResponse,
  ChapterDetails,
  ChapterQuizData,
  ChapterStatus,
  NovelDetails,
  NovelFilterParams,
  NovelListItem,
  NovelsResponse,
  Question,
  QuestionCompletionResult,
  QuizCompletionResult,
} from "@/types/novel";
