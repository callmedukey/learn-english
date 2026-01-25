import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { PaymentHistoryList } from "@/components/profile";
import { apiClient } from "@/services/api/client";

interface PaymentHistoryResponse {
  payments: {
    id: string;
    date: string;
    planName: string;
    amount: number;
    currency: string;
    status: string;
    paymentSource: string;
    method: string | null;
  }[];
  total: number;
  page: number;
  perPage: number;
}

type DateFilter = "30d" | "90d" | "all";

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All" },
];

async function fetchPaymentHistory(
  dateFilter: DateFilter
): Promise<PaymentHistoryResponse> {
  const response = await apiClient.get<PaymentHistoryResponse>(
    `/api/mobile/subscription/history?dateFilter=${dateFilter}`
  );
  return response.data;
}

export default function PaymentsScreen() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("90d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["paymentHistory", dateFilter],
    queryFn: () => fetchPaymentHistory(dateFilter),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#5D3A29" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-4">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="mt-3 text-center text-foreground">
          Failed to load payment history
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Date Filter */}
      <View className="flex-row gap-2 px-4 py-3">
        {DATE_FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`flex-1 items-center rounded-lg py-2 ${
              dateFilter === option.value
                ? "bg-primary"
                : "border border-border bg-white"
            }`}
            onPress={() => setDateFilter(option.value)}
          >
            <Text
              className={`text-sm font-medium ${
                dateFilter === option.value ? "text-white" : "text-foreground"
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      {data && data.payments.length > 0 && (
        <View className="mx-4 mb-3 rounded-lg bg-muted p-3">
          <Text className="text-sm text-muted-foreground">
            {data.total} payment{data.total !== 1 ? "s" : ""} total
          </Text>
        </View>
      )}

      {/* Payment List */}
      <View className="flex-1 px-4">
        <PaymentHistoryList
          payments={data?.payments || []}
          isLoading={isLoading}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      </View>
    </View>
  );
}
