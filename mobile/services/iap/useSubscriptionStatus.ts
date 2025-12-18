import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../api/client";

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: {
    id: string;
    status: string;
    planName: string;
    planDuration: number;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    isTrialPeriod: boolean;
    autoRenew: boolean;
    paymentSource: string;
    storeProductId: string | null;
  } | null;
  availablePlans: {
    id: string;
    name: string;
    price: number;
    priceUSD: number | null;
    duration: number;
    description: string | null;
  }[];
}

async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  const response = await apiClient.get<SubscriptionStatus>(
    "/api/mobile/subscription/status"
  );
  return response.data;
}

export function useSubscriptionStatus() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["subscriptionStatus"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
  };

  return {
    ...query,
    refreshSubscription,
    hasActiveSubscription: query.data?.hasActiveSubscription ?? false,
    subscription: query.data?.subscription ?? null,
    availablePlans: query.data?.availablePlans ?? [],
  };
}
