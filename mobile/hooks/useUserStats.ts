import { useQuery } from "@tanstack/react-query";

import { fetchUserStats, type UserStatsData } from "@/services/api/user-stats";

export function useUserStats(userId: string | null) {
  return useQuery<UserStatsData>({
    queryKey: ["userStats", userId],
    queryFn: () => fetchUserStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export type { UserStatsData } from "@/services/api/user-stats";
