import { Ionicons } from "@expo/vector-icons";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useCallback } from "react";

import { SubscriptionCard, SubscriptionPlans } from "@/components/profile";
import { useSubscriptionStatus, useIAP } from "@/services/iap";

export default function SubscriptionScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    hasActiveSubscription,
    subscription,
    isLoading,
    isError,
    refetch,
    refreshSubscription,
  } = useSubscriptionStatus();
  const { openSubscriptionManagement } = useIAP(refreshSubscription);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  if (isLoading && !subscription) {
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
          Failed to load subscription information
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#5D3A29"
        />
      }
    >
      {hasActiveSubscription && subscription ? (
        <>
          {/* Current Subscription */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-foreground">
              Current Subscription
            </Text>
            <SubscriptionCard
              subscription={subscription}
              onManagePress={openSubscriptionManagement}
            />
          </View>

          {/* Benefits */}
          <View className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="mb-3 text-base font-semibold text-foreground">
              Subscription Benefits
            </Text>
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <Ionicons name="book" size={16} color="#22C55E" />
                </View>
                <Text className="text-sm text-foreground">
                  Unlimited access to all novels
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Ionicons name="document-text" size={16} color="#2563EB" />
                </View>
                <Text className="text-sm text-foreground">
                  Unlimited RC practice
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Ionicons name="trophy" size={16} color="#F59E0B" />
                </View>
                <Text className="text-sm text-foreground">
                  Monthly leaderboard access
                </Text>
              </View>
            </View>
          </View>

          {/* Cancellation Info */}
          <View className="rounded-xl bg-muted p-4">
            <Text className="text-sm text-muted-foreground">
              Subscription cancellation and refunds can be managed in{" "}
              {subscription.paymentSource === "APPLE"
                ? "App Store"
                : subscription.paymentSource === "GOOGLE"
                ? "Google Play"
                : "Toss Payments"}{" "}
              settings.
            </Text>
          </View>
        </>
      ) : (
        <>
          {/* No Subscription - Show Plans */}
          <View className="mb-4">
            <Text className="mb-2 text-xl font-bold text-foreground">
              Premium Subscription
            </Text>
            <Text className="text-muted-foreground">
              Boost your English skills with unlimited learning
            </Text>
          </View>

          <SubscriptionPlans
            onSubscriptionChange={refreshSubscription}
            currentProductId={subscription?.storeProductId}
          />
        </>
      )}
    </ScrollView>
  );
}
