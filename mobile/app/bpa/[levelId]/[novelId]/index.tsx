import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BPAChapterCard,
  BPANovelDetailsSkeleton,
  BPAProgressSummary,
  BPAUnitSection,
} from "@/components/bpa";
import { ErrorState } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { useBPANovelDetails } from "@/hooks/useBPA";

export default function BPANovelDetailsScreen() {
  const { levelId, novelId } = useLocalSearchParams<{
    levelId: string;
    novelId: string;
  }>();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useBPANovelDetails(levelId, novelId);
  const { user } = useAuth();

  // BPA is VIP-exclusive, so user must have active paid subscription
  const userHasPaidSubscription = user?.hasPaidSubscription || false;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing && !data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <BPANovelDetailsSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <ErrorState
          title="Failed to load novel details"
          message={error.message || "Please check your connection and try again"}
          onRetry={refetch}
          isRetrying={refreshing}
        />
      </SafeAreaView>
    );
  }

  if (!data) {
    return null;
  }

  const { bpaLevel, units, chapters } = data;
  const hasUnits = units && units.length > 0;

  // Generate star display
  const stars = bpaLevel ? "★".repeat(bpaLevel.stars) : "";

  return (
    <>
      <Stack.Screen
        options={{
          title: data.title,
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Novel Header */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground">
              {data.title}
            </Text>
            {bpaLevel && (
              <View className="mt-1 flex-row items-center gap-2">
                <Text className="text-sm text-muted-foreground">
                  {bpaLevel.name}
                </Text>
                <Text className="text-amber-500">{stars}</Text>
              </View>
            )}
            {data.description && (
              <Text className="mt-2 text-sm text-muted-foreground">
                {data.description}
              </Text>
            )}
          </View>

          {/* Progress Summary */}
          <View className="mb-6">
            <BPAProgressSummary
              totalChapters={data.totalChapters}
              completedChapters={data.completedChapters}
              freeChapters={data.freeChapters}
              progress={data.progress}
            />
          </View>

          {/* Chapters Section */}
          <View>
            <Text className="mb-4 text-lg font-semibold text-foreground">
              Chapters
            </Text>

            {hasUnits ? (
              // Show chapters grouped by units
              units.map((unit) => (
                <BPAUnitSection
                  key={unit.id}
                  unit={unit}
                  levelId={levelId}
                  novelId={novelId}
                  userHasPaidSubscription={userHasPaidSubscription}
                />
              ))
            ) : (
              // Show flat list of chapters
              <View className="gap-3">
                {chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <BPAChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      levelId={levelId}
                      novelId={novelId}
                      userHasPaidSubscription={userHasPaidSubscription}
                    />
                  ))
                ) : (
                  <View className="rounded-xl bg-muted/50 p-4">
                    <Text className="text-center text-sm text-muted-foreground">
                      No chapters available yet.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
