import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RCQuizComponent } from "@/components/rc";
import { useAuth } from "@/hooks/useAuth";
import { useRCQuizData } from "@/hooks/useRC";

function RCQuizSkeleton() {
  return (
    <View className="flex-1 p-4">
      <View className="gap-4">
        {/* Header skeleton */}
        <View className="h-24 animate-pulse rounded-2xl bg-muted" />

        {/* Reading phase skeleton */}
        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="h-6 w-32 animate-pulse rounded bg-muted" />
            <View className="h-6 w-20 animate-pulse rounded bg-muted" />
          </View>

          <View className="gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                className="h-4 animate-pulse rounded bg-muted"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            ))}
          </View>

          <View className="mt-6 h-12 animate-pulse rounded-lg bg-muted" />
        </View>
      </View>
    </View>
  );
}

export default function RCQuizScreen() {
  const { rcLevelId, keywordId } = useLocalSearchParams<{
    rcLevelId: string;
    keywordId: string;
  }>();
  const searchParams = useLocalSearchParams<{ status?: string }>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useRCQuizData(
    rcLevelId,
    keywordId,
    searchParams.status
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <RCQuizSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <ScrollView
          contentContainerClassName="flex-1 items-center justify-center px-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text className="mb-2 text-lg font-semibold text-destructive">
            Unable to load
          </Text>
          <Text className="text-center text-muted-foreground">
            {error?.message || "Please try again later"}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const userHasPaidSubscription = user?.hasPaidSubscription || false;

  return (
    <>
      <Stack.Screen
        options={{
          title: data.keyword.name,
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <RCQuizComponent
          quizData={data}
          userHasPaidSubscription={userHasPaidSubscription}
        />
      </SafeAreaView>
    </>
  );
}
