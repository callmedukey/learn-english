import { useQuery } from "@tanstack/react-query";

import {
  fetchScoreLog,
  type ScoreLogResponse,
  type ScoreSourceFilter,
} from "@/services/api/score-log";

interface UseScoreLogParams {
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  source?: ScoreSourceFilter;
}

export function useScoreLog({
  enabled = true,
  page = 1,
  pageSize = 20,
  source,
}: UseScoreLogParams = {}) {
  return useQuery<ScoreLogResponse>({
    queryKey: ["scoreLog", page, pageSize, source],
    queryFn: () => fetchScoreLog({ page, pageSize, source }),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
