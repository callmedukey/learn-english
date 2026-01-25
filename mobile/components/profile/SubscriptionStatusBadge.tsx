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
        label: "Free Trial",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
      };
    }

    if (daysRemaining && daysRemaining <= 3) {
      return {
        label: "Expiring Soon",
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
      };
    }

    switch (status) {
      case "ACTIVE":
        return {
          label: "Active",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
        };
      case "EXPIRED":
        return {
          label: "Expired",
          bgColor: "bg-red-100",
          textColor: "text-red-700",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
        };
      case "PENDING":
        return {
          label: "Pending",
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
