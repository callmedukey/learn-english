import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity } from "react-native";

import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

interface SubscriptionCardProps {
  subscription: {
    planName: string;
    status: string;
    endDate: string;
    daysRemaining: number;
    isTrialPeriod: boolean;
    autoRenew: boolean;
    paymentSource: string;
  };
  onManagePress?: () => void;
}

export function SubscriptionCard({
  subscription,
  onManagePress,
}: SubscriptionCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPaymentSourceLabel = (source: string) => {
    switch (source) {
      case "APPLE":
        return "App Store";
      case "GOOGLE":
        return "Google Play";
      case "TOSS":
        return "토스 결제";
      default:
        return source;
    }
  };

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="star" size={20} color="#5D3A29" />
          <Text className="text-lg font-semibold text-foreground">
            {subscription.planName}
          </Text>
        </View>
        <SubscriptionStatusBadge
          status={subscription.status}
          isTrialPeriod={subscription.isTrialPeriod}
          daysRemaining={subscription.daysRemaining}
        />
      </View>

      {/* Trial Badge */}
      {subscription.isTrialPeriod && (
        <View className="mb-4 rounded-lg bg-blue-50 p-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="gift" size={18} color="#2563EB" />
            <Text className="text-sm text-blue-700">
              7일 무료 체험 기간 중입니다
            </Text>
          </View>
        </View>
      )}

      {/* Details */}
      <View className="mb-4 gap-3">
        {/* End Date */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">만료일</Text>
          <Text className="text-sm font-medium text-foreground">
            {formatDate(subscription.endDate)}
          </Text>
        </View>

        {/* Days Remaining */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">남은 기간</Text>
          <Text className="text-sm font-medium text-foreground">
            {subscription.daysRemaining}일
          </Text>
        </View>

        {/* Auto Renewal */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">자동 갱신</Text>
          <View className="flex-row items-center gap-1">
            <Ionicons
              name={subscription.autoRenew ? "checkmark-circle" : "close-circle"}
              size={16}
              color={subscription.autoRenew ? "#22C55E" : "#EF4444"}
            />
            <Text
              className={`text-sm font-medium ${
                subscription.autoRenew ? "text-green-600" : "text-red-600"
              }`}
            >
              {subscription.autoRenew ? "켜짐" : "꺼짐"}
            </Text>
          </View>
        </View>

        {/* Payment Source */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">결제 경로</Text>
          <Text className="text-sm font-medium text-foreground">
            {getPaymentSourceLabel(subscription.paymentSource)}
          </Text>
        </View>
      </View>

      {/* Manage Button */}
      {(subscription.paymentSource === "APPLE" ||
        subscription.paymentSource === "GOOGLE") && (
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 rounded-lg border border-primary py-3"
          onPress={onManagePress}
          activeOpacity={0.7}
        >
          <Text className="text-sm font-medium text-primary">구독 관리</Text>
          <Ionicons name="open-outline" size={16} color="#5D3A29" />
        </TouchableOpacity>
      )}

      {/* Info Note */}
      {!subscription.autoRenew && subscription.status === "ACTIVE" && (
        <View className="mt-3 rounded-lg bg-amber-50 p-3">
          <Text className="text-xs text-amber-700">
            자동 갱신이 꺼져 있습니다. 만료일 이후에는 구독이 종료됩니다.
          </Text>
        </View>
      )}
    </View>
  );
}
