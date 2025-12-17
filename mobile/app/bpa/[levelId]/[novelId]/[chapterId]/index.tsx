import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BPAQuizComponent, BPAQuizSkeleton } from "@/components/bpa";
import { useAuth } from "@/hooks/useAuth";
import { useBPAChapterDetails } from "@/hooks/useBPA";

export default function BPAChapterQuizScreen() {
  const { levelId, novelId, chapterId, status } = useLocalSearchParams<{
    levelId: string;
    novelId: string;
    chapterId: string;
    status?: string;
  }>();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useBPAChapterDetails(
    levelId,
    novelId,
    chapterId,
    status
  );

  const { user } = useAuth();

  // BPA is VIP-exclusive, so user must have active paid subscription
  const userHasPaidSubscription = user?.hasPaidSubscription || false;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <BPAQuizSkeleton />
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

  return (
    <>
      <Stack.Screen
        options={{
          title: `Chapter ${data.orderNumber}`,
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <BPAQuizComponent
          chapter={data}
          levelId={levelId}
          novelId={novelId}
          userHasPaidSubscription={userHasPaidSubscription}
        />
      </SafeAreaView>
    </>
  );
}
