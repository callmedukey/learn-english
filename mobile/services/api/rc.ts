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

import { apiClient } from "./client";

// Fetch all RC levels with user progress
export async function fetchRCLevels(): Promise<RCLevelsResponse> {
  const response = await apiClient.get<RCLevelsResponse>(
    "/api/mobile/rc/rc-levels"
  );
  return response.data;
}

// Fetch keywords for a specific RC level with filters
export async function fetchRCKeywords(
  rcLevelId: string,
  params: RCFilterParams = {}
): Promise<RCKeywordsResponse> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.set("search", params.search);
  if (params.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);
  if (params.status) queryParams.set("status", params.status);
  if (params.page) queryParams.set("page", String(params.page));
  if (params.perPage) queryParams.set("perPage", String(params.perPage));

  const queryString = queryParams.toString();
  const url = `/api/mobile/rc/${rcLevelId}/keywords${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<RCKeywordsResponse>(url);
  return response.data;
}

// Fetch quiz data for a specific keyword
export async function fetchRCQuizData(
  rcLevelId: string,
  keywordId: string,
  status?: string
): Promise<RCQuizData> {
  const url = status
    ? `/api/mobile/rc/${rcLevelId}/${keywordId}?status=${status}`
    : `/api/mobile/rc/${rcLevelId}/${keywordId}`;

  const response = await apiClient.get<RCQuizData>(url);
  return response.data;
}

// Mark question as started
export async function markRCQuestionStarted(
  data: QuestionStartData
): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.post<{ success: boolean; error?: string }>(
    "/api/mobile/rc/question",
    {
      action: "start",
      ...data,
    }
  );
  return response.data;
}

// Complete a question with answer
export async function completeRCQuestion(
  data: QuestionCompleteData
): Promise<QuestionCompletionResult> {
  const response = await apiClient.post<QuestionCompletionResult>(
    "/api/mobile/rc/question",
    {
      action: "complete",
      ...data,
    }
  );
  return response.data;
}

// Save quiz completion (first/second try)
export async function completeRCQuiz(
  data: QuizCompleteData
): Promise<QuizCompletionResult> {
  const response = await apiClient.post<QuizCompletionResult>(
    "/api/mobile/rc/question",
    {
      action: "quiz-complete",
      ...data,
    }
  );
  return response.data;
}
