import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity, Linking, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStatus } from "@/services/iap";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { hasActiveSubscription, subscription, refreshSubscription } = useSubscriptionStatus();

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refreshUser?.(), refreshSubscription()]);
    setIsRefreshing(false);
  }, [refreshUser, refreshSubscription]);

  const handleSupportPress = () => {
    // Open support email or website
    Linking.openURL("mailto:support@readingcamp.kr");
  };

  const formatDaysRemaining = (days: number) => {
    if (days <= 0) return "Expired";
    if (days === 1) return "1 day remaining";
    return `${days} days remaining`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1 px-4 py-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#5D3A29"
          />
        }
      >
        {/* User Info */}
        <View className="mb-6 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
            <FontAwesome name="user" size={40} color="#F9F5F0" />
          </View>
          <Text className="text-xl font-semibold text-foreground">
            {user?.nickname || user?.name || "User"}
          </Text>
          <Text className="text-muted-foreground">{user?.email}</Text>
          {hasActiveSubscription && (
            <View className="mt-2 flex-row items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
              <FontAwesome name="star" size={12} color="#5D3A29" />
              <Text className="text-sm font-medium text-primary">VIP Member</Text>
            </View>
          )}
        </View>

        {/* Subscription Status Card */}
        {hasActiveSubscription && subscription ? (
          <TouchableOpacity
            className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
            onPress={() => router.push("/profile/subscription")}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Ionicons name="star" size={20} color="#5D3A29" />
                </View>
                <View>
                  <Text className="font-semibold text-foreground">
                    {subscription.planName}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {subscription.isTrialPeriod
                      ? "Free trial active"
                      : formatDaysRemaining(subscription.daysRemaining)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="mb-6 rounded-2xl bg-primary p-4"
            onPress={() => router.push("/profile/subscription")}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Ionicons name="star" size={20} color="white" />
                </View>
                <View>
                  <Text className="font-semibold text-white">
                    Subscribe to Premium
                  </Text>
                  <Text className="text-sm text-white/80">
                    Start 7-day free trial
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </View>
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View className="mb-6 gap-2">
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-xl bg-white p-4"
            onPress={() => router.push("/profile/subscription")}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="card-outline" size={22} color="#5D3A29" />
              <Text className="text-base text-foreground">Subscription</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between rounded-xl bg-white p-4"
            onPress={() => router.push("/profile/settings")}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="settings-outline" size={22} color="#5D3A29" />
              <Text className="text-base text-foreground">Account Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between rounded-xl bg-white p-4"
            onPress={() => router.push("/profile/payments")}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="receipt-outline" size={22} color="#5D3A29" />
              <Text className="text-base text-foreground">Payment History</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between rounded-xl bg-white p-4"
            onPress={handleSupportPress}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="help-circle-outline" size={22} color="#5D3A29" />
              <Text className="text-base text-foreground">Help & Support</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="rounded-xl bg-destructive/10 p-4"
          onPress={signOut}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="font-semibold text-destructive">Log Out</Text>
          </View>
        </TouchableOpacity>

        {/* App Version */}
        <Text className="mt-8 text-center text-sm text-muted-foreground">
          Reading Camp v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
