import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { QuizComponent } from "@/components/novel";
import { useChapterDetails } from "@/hooks/useNovel";
import { useAuth } from "@/hooks/useAuth";

function ChapterQuizSkeleton() {
  return (
    <View className="flex-1 p-4">
      <View className="gap-4">
        {/* Progress skeleton */}
        <View className="h-20 animate-pulse rounded-2xl bg-muted" />

        {/* Question pills skeleton */}
        <View className="flex-row gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              className="h-8 w-8 animate-pulse rounded-full bg-muted"
            />
          ))}
        </View>

        {/* Question card skeleton */}
        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="h-6 w-24 animate-pulse rounded bg-muted" />
            <View className="h-6 w-20 animate-pulse rounded bg-muted" />
          </View>

          <View className="h-32 animate-pulse rounded-lg bg-muted" />

          <View className="mt-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                className="h-14 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ChapterQuizScreen() {
  const { arId, novelId, chapterId } = useLocalSearchParams<{
    arId: string;
    novelId: string;
    chapterId: string;
  }>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useChapterDetails(
    arId,
    novelId,
    chapterId
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <ChapterQuizSkeleton />
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
          title: `Chapter ${data.orderNumber}`,
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <QuizComponent
          chapter={data}
          arId={arId}
          novelId={novelId}
          userHasPaidSubscription={userHasPaidSubscription}
        />
      </SafeAreaView>
    </>
  );
}
