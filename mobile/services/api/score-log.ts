import type {
  ScoreLogResponse,
  ScoreSourceFilter,
} from "@shared/types/score-log.types";

import { apiClient } from "./client";

export interface FetchScoreLogParams {
  page?: number;
  pageSize?: number;
  source?: ScoreSourceFilter;
}

export async function fetchScoreLog(
  params: FetchScoreLogParams = {}
): Promise<ScoreLogResponse> {
  const { page = 1, pageSize = 20, source } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (source) {
    queryParams.append("source", source);
  }

  const response = await apiClient.get<ScoreLogResponse>(
    `/api/mobile/user/score-log?${queryParams.toString()}`
  );
  return response.data;
}

export type { ScoreLogResponse, ScoreSourceFilter };
