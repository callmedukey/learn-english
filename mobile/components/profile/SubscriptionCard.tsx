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
    return date.toLocaleDateString("en-US", {
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
        return "Toss Payments";
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
              You are in a 7-day free trial period
            </Text>
          </View>
        </View>
      )}

      {/* Details */}
      <View className="mb-4 gap-3">
        {/* End Date */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">Expires</Text>
          <Text className="text-sm font-medium text-foreground">
            {formatDate(subscription.endDate)}
          </Text>
        </View>

        {/* Days Remaining */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">Days Remaining</Text>
          <Text className="text-sm font-medium text-foreground">
            {subscription.daysRemaining} days
          </Text>
        </View>

        {/* Auto Renewal */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">Auto Renewal</Text>
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
              {subscription.autoRenew ? "On" : "Off"}
            </Text>
          </View>
        </View>

        {/* Payment Source */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">Payment Method</Text>
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
          <Text className="text-sm font-medium text-primary">Manage Subscription</Text>
          <Ionicons name="open-outline" size={16} color="#5D3A29" />
        </TouchableOpacity>
      )}

      {/* Info Note */}
      {!subscription.autoRenew && subscription.status === "ACTIVE" && (
        <View className="mt-3 rounded-lg bg-amber-50 p-3">
          <Text className="text-xs text-amber-700">
            Auto renewal is off. Your subscription will end after the expiration date.
          </Text>
        </View>
      )}
    </View>
  );
}
