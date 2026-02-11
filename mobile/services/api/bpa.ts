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
  BPATimeframesResponse,
  CampusEventsResponse,
} from "@/types/bpa";

import { apiClient } from "./client";

// Fetch all BPA levels with user progress
export async function fetchBPALevels(): Promise<BPALevelsResponse> {
  const response = await apiClient.get<BPALevelsResponse>(
    "/api/mobile/bpa/bpa-levels"
  );
  return response.data;
}

// Fetch novels for a specific BPA level with filters
export async function fetchBPANovels(
  levelId: string,
  params: BPANovelFilterParams = {}
): Promise<BPANovelsResponse> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.set("search", params.search);
  if (params.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);
  if (params.status) queryParams.set("status", params.status);
  if (params.page) queryParams.set("page", String(params.page));
  if (params.perPage) queryParams.set("perPage", String(params.perPage));

  const queryString = queryParams.toString();
  const url = `/api/mobile/bpa/${levelId}/novels${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<BPANovelsResponse>(url);
  return response.data;
}

// Fetch BPA novel details with chapters
export async function fetchBPANovelDetails(
  levelId: string,
  novelId: string
): Promise<BPANovelDetails> {
  const response = await apiClient.get<BPANovelDetails>(
    `/api/mobile/bpa/${levelId}/${novelId}`
  );
  return response.data;
}

// Fetch BPA chapter details with questions for quiz
export async function fetchBPAChapterDetails(
  levelId: string,
  novelId: string,
  chapterId: string,
  status?: string
): Promise<BPAChapterQuizData> {
  const url = status
    ? `/api/mobile/bpa/${levelId}/${novelId}/${chapterId}?status=${status}`
    : `/api/mobile/bpa/${levelId}/${novelId}/${chapterId}`;

  const response = await apiClient.get<BPAChapterQuizData>(url);
  return response.data;
}

// Mark BPA question as started
export async function markBPAQuestionStarted(
  data: BPAQuestionStartData
): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.post<{ success: boolean; error?: string }>(
    "/api/mobile/bpa/question",
    {
      action: "start",
      ...data,
    }
  );
  return response.data;
}

// Complete a BPA question with answer
export async function completeBPAQuestion(
  data: BPAQuestionCompleteData
): Promise<BPAQuestionCompletionResult> {
  const response = await apiClient.post<BPAQuestionCompletionResult>(
    "/api/mobile/bpa/question",
    {
      action: "complete",
      ...data,
    }
  );
  return response.data;
}

// Save BPA quiz completion (first/second try)
export async function completeBPAQuiz(
  data: BPAQuizCompleteData
): Promise<BPAQuizCompletionResult> {
  const response = await apiClient.post<BPAQuizCompletionResult>(
    "/api/mobile/bpa/question",
    {
      action: "quiz-complete",
      ...data,
    }
  );
  return response.data;
}

// Fetch BPA timeframes with semesters
export async function fetchBPATimeframes(): Promise<BPATimeframesResponse> {
  const response = await apiClient.get<BPATimeframesResponse>(
    "/api/mobile/bpa/timeframes"
  );
  return response.data;
}

// Fetch BPA rankings for a specific timeframe, season, and level
export async function fetchBPARankings(
  timeframeId: string,
  season: "Spring" | "Summer" | "Fall" | "Winter",
  levelId: string
): Promise<BPARankingsResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set("timeframeId", timeframeId);
  queryParams.set("season", season);
  queryParams.set("levelId", levelId);

  const response = await apiClient.get<BPARankingsResponse>(
    `/api/mobile/bpa/rankings?${queryParams.toString()}`
  );
  return response.data;
}

// Fetch campus events for the user's campus
export async function fetchCampusEvents(): Promise<CampusEventsResponse> {
  const response = await apiClient.get<CampusEventsResponse>(
    "/api/mobile/bpa/campus-events"
  );
  return response.data;
}
