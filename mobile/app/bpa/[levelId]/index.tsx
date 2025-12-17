import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BPANovelCard, BPANovelsSkeleton } from "@/components/bpa";
import { useBPANovels, type BPANovelFilterParams } from "@/hooks/useBPA";

type StatusFilter = "all" | "completed" | "inProgress" | "notStarted";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "In Progress", value: "inProgress" },
  { label: "Not Started", value: "notStarted" },
];

export default function BPANovelsScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const [filters, setFilters] = useState<BPANovelFilterParams>({
    status: "all",
    page: 1,
  });
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useBPANovels(levelId, filters);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleStatusChange = (status: StatusFilter) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleLoadMore = () => {
    if (
      data?.pagination &&
      data.pagination.currentPage < data.pagination.totalPages
    ) {
      setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  };

  if (isLoading && !refreshing && !data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <BPANovelsSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="mb-2 text-lg font-semibold text-destructive">
            Unable to load
          </Text>
          <Text className="text-center text-muted-foreground">
            {error.message || "Please try again later"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const novels = data?.novels || [];
  const bpaLevel = data?.bpaLevel;
  const pagination = data?.pagination;

  // Generate star display
  const stars = bpaLevel ? "★".repeat(bpaLevel.stars) : "";

  return (
    <>
      <Stack.Screen
        options={{
          title: bpaLevel?.name || "Novels",
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <FlatList
          data={novels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BPANovelCard novel={item} levelId={levelId} />
          )}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              {/* Level Info Header */}
              {bpaLevel && (
                <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xl font-bold text-foreground">
                      {bpaLevel.name}
                    </Text>
                    <Text className="text-lg text-amber-500">{stars}</Text>
                  </View>
                  {bpaLevel.description && (
                    <Text className="mt-1 text-sm text-muted-foreground">
                      {bpaLevel.description}
                    </Text>
                  )}
                </View>
              )}

              {/* Novel Count */}
              {pagination && (
                <View className="mb-4">
                  <Text className="text-sm text-muted-foreground">
                    {pagination.totalCount} novel
                    {pagination.totalCount !== 1 ? "s" : ""} available
                  </Text>
                </View>
              )}

              {/* Status Filters */}
              <View className="mb-4 flex-row gap-2">
                {STATUS_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    className={`rounded-full px-3 py-1.5 ${
                      filters.status === filter.value
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                    onPress={() => handleStatusChange(filter.value)}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        filters.status === filter.value
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-lg font-medium text-foreground">
                No novels found
              </Text>
              <Text className="mt-1 text-center text-muted-foreground">
                Try adjusting your filters
              </Text>
            </View>
          }
          ListFooterComponent={
            pagination && pagination.currentPage < pagination.totalPages ? (
              <TouchableOpacity
                className="mt-4 rounded-lg bg-muted py-3"
                onPress={handleLoadMore}
              >
                <Text className="text-center font-medium text-foreground">
                  Load More
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </SafeAreaView>
    </>
  );
}
