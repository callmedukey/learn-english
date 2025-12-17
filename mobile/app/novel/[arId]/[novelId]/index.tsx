import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StarRating } from "@/components/common/StarRating";
import {
  ChapterCard,
  NovelDetailsSkeleton,
  ProgressSummaryCard,
} from "@/components/novel";
import { useNovelDetails } from "@/hooks/useNovel";
import { useAuth } from "@/hooks/useAuth";

export default function NovelDetailsScreen() {
  const { arId, novelId } = useLocalSearchParams<{
    arId: string;
    novelId: string;
  }>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useNovelDetails(arId, novelId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <NovelDetailsSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="mb-2 text-lg font-semibold text-destructive">
            Unable to load
          </Text>
          <Text className="text-center text-muted-foreground">
            {error?.message || "Please try again later"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const userHasPaidSubscription = user?.hasPaidSubscription || false;

  return (
    <>
      <Stack.Screen
        options={{
          title: data.title,
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <FlatList
          data={data.chapters}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChapterCard
              chapter={item}
              arId={arId}
              novelId={novelId}
              userHasPaidSubscription={userHasPaidSubscription}
            />
          )}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View className="gap-4">
              {/* Novel Info */}
              <View className="rounded-2xl bg-white p-4 shadow-sm">
                <Text className="mb-2 text-xl font-bold text-foreground">
                  {data.title}
                </Text>

                {/* AR Badge & Stars */}
                {data.ar && (
                  <View className="mb-3 flex-row flex-wrap gap-2">
                    <View className="rounded-full bg-primary/10 px-2 py-1">
                      <Text className="text-xs font-medium text-primary">
                        {data.ar.level}
                      </Text>
                    </View>
                    <View className="rounded-full bg-amber-100 px-2 py-1">
                      <Text className="text-xs font-medium text-amber-700">
                        AR: {data.ar.score}
                      </Text>
                    </View>
                    <StarRating stars={data.ar?.stars || 0} size={14} />
                  </View>
                )}

                {/* Description */}
                {data.description && (
                  <Text className="text-sm text-muted-foreground">
                    {data.description}
                  </Text>
                )}
              </View>

              {/* Progress Summary */}
              <ProgressSummaryCard
                completedChapters={data.completedChapters}
                totalChapters={data.totalChapters}
                freeChapters={data.freeChapters}
                progress={data.progress}
              />

              {/* Chapters Header */}
              <Text className="text-lg font-semibold text-foreground">
                Chapters
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center rounded-2xl bg-white py-8 shadow-sm">
              <Text className="text-4xl">📖</Text>
              <Text className="mt-2 text-lg font-medium text-foreground">
                No Chapters Yet
              </Text>
              <Text className="mt-1 text-center text-muted-foreground">
                This novel doesn't have any chapters yet.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}
