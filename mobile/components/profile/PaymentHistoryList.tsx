import { Ionicons } from "@expo/vector-icons";
import { View, Text, FlatList, ActivityIndicator } from "react-native";

interface PaymentItem {
  id: string;
  date: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  paymentSource: string;
  method: string | null;
}

interface PaymentHistoryListProps {
  payments: PaymentItem[];
  isLoading: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PaymentHistoryList({
  payments,
  isLoading,
  onRefresh,
  isRefreshing = false,
}: PaymentHistoryListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "KRW") {
      return `₩${amount.toLocaleString()}`;
    }
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PAID":
        return {
          label: "결제 완료",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          icon: "checkmark-circle" as const,
          iconColor: "#22C55E",
        };
      case "WAIVED":
        return {
          label: "무료",
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          icon: "gift" as const,
          iconColor: "#2563EB",
        };
      case "REFUNDED":
        return {
          label: "환불됨",
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          icon: "arrow-undo" as const,
          iconColor: "#EF4444",
        };
      default:
        return {
          label: status,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          icon: "help-circle" as const,
          iconColor: "#6B7280",
        };
    }
  };

  const getPaymentSourceIcon = (source: string) => {
    switch (source) {
      case "APPLE":
        return "logo-apple" as const;
      case "GOOGLE":
        return "logo-google" as const;
      default:
        return "card" as const;
    }
  };

  const renderItem = ({ item }: { item: PaymentItem }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <View className="mb-3 rounded-xl bg-white p-4 shadow-sm">
        <View className="flex-row items-start justify-between">
          {/* Left side - Plan info */}
          <View className="flex-1">
            <View className="mb-1 flex-row items-center gap-2">
              <Ionicons
                name={getPaymentSourceIcon(item.paymentSource)}
                size={16}
                color="#6B7280"
              />
              <Text className="text-base font-semibold text-foreground">
                {item.planName}
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground">
              {formatDate(item.date)}
            </Text>
          </View>

          {/* Right side - Amount and status */}
          <View className="items-end">
            <Text className="text-base font-semibold text-foreground">
              {formatAmount(item.amount, item.currency)}
            </Text>
            <View
              className={`mt-1 flex-row items-center gap-1 rounded-full px-2 py-0.5 ${statusConfig.bgColor}`}
            >
              <Ionicons
                name={statusConfig.icon}
                size={12}
                color={statusConfig.iconColor}
              />
              <Text className={`text-xs ${statusConfig.textColor}`}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && payments.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <ActivityIndicator size="large" color="#5D3A29" />
      </View>
    );
  }

  if (payments.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
        <Text className="mt-3 text-center text-muted-foreground">
          결제 내역이 없습니다
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={payments}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
    />
  );
}
