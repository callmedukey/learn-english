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

import { apiClient } from "./client";

// Fetch all AR levels with user progress
export async function fetchARLevels(): Promise<ARLevelsResponse> {
  const response = await apiClient.get<ARLevelsResponse>(
    "/api/mobile/novel/ar-levels"
  );
  return response.data;
}

// Fetch novels for a specific AR level with filters
export async function fetchNovels(
  arId: string,
  params: NovelFilterParams = {}
): Promise<NovelsResponse> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.set("search", params.search);
  if (params.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);
  if (params.status) queryParams.set("status", params.status);
  if (params.page) queryParams.set("page", String(params.page));
  if (params.perPage) queryParams.set("perPage", String(params.perPage));

  const queryString = queryParams.toString();
  const url = `/api/mobile/novel/${arId}/novels${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<NovelsResponse>(url);
  return response.data;
}

// Fetch novel details with chapters
export async function fetchNovelDetails(
  arId: string,
  novelId: string
): Promise<NovelDetails> {
  const response = await apiClient.get<NovelDetails>(
    `/api/mobile/novel/${arId}/${novelId}`
  );
  return response.data;
}

// Fetch chapter details with questions for quiz
export async function fetchChapterDetails(
  arId: string,
  novelId: string,
  chapterId: string
): Promise<ChapterQuizData> {
  const response = await apiClient.get<ChapterQuizData>(
    `/api/mobile/novel/${arId}/${novelId}/${chapterId}`
  );
  return response.data;
}

// Mark question as started
export async function markQuestionStarted(
  data: QuestionStartData
): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.post<{ success: boolean; error?: string }>(
    "/api/mobile/novel/question",
    {
      action: "start",
      ...data,
    }
  );
  return response.data;
}

// Complete a question with answer
export async function completeQuestion(
  data: QuestionCompleteData
): Promise<QuestionCompletionResult> {
  const response = await apiClient.post<QuestionCompletionResult>(
    "/api/mobile/novel/question",
    {
      action: "complete",
      ...data,
    }
  );
  return response.data;
}

// Save quiz completion (first/second try)
export async function completeQuiz(
  data: QuizCompleteData
): Promise<QuizCompletionResult> {
  const response = await apiClient.post<QuizCompletionResult>(
    "/api/mobile/novel/question",
    {
      action: "quiz-complete",
      ...data,
    }
  );
  return response.data;
}
