import { useQuery } from "@tanstack/react-query";

import { fetchDashboard, type DashboardData } from "@/services/api/dashboard";

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

export type { DashboardData } from "@/services/api/dashboard";
