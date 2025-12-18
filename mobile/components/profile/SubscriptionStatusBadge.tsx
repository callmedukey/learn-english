import { View, Text } from "react-native";

interface SubscriptionStatusBadgeProps {
  status: string;
  isTrialPeriod?: boolean;
  daysRemaining?: number;
}

export function SubscriptionStatusBadge({
  status,
  isTrialPeriod,
  daysRemaining,
}: SubscriptionStatusBadgeProps) {
  const getStatusConfig = () => {
    if (isTrialPeriod) {
      return {
        label: "무료 체험 중",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
      };
    }

    if (daysRemaining && daysRemaining <= 3) {
      return {
        label: "곧 만료",
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
      };
    }

    switch (status) {
      case "ACTIVE":
        return {
          label: "활성",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
        };
      case "EXPIRED":
        return {
          label: "만료됨",
          bgColor: "bg-red-100",
          textColor: "text-red-700",
        };
      case "CANCELLED":
        return {
          label: "취소됨",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
        };
      case "PENDING":
        return {
          label: "대기 중",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
        };
      default:
        return {
          label: status,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View className={`rounded-full px-3 py-1 ${config.bgColor}`}>
      <Text className={`text-xs font-medium ${config.textColor}`}>
        {config.label}
      </Text>
    </View>
  );
}
