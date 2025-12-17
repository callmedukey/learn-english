import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Pagination, StarRating } from "@/components/common";
import { NovelCard, NovelFilters, NovelListSkeleton } from "@/components/novel";
import { useNovels, type NovelFilterParams } from "@/hooks/useNovel";

export default function NovelListScreen() {
  const { arId } = useLocalSearchParams<{ arId: string }>();
  const [filters, setFilters] = useState<NovelFilterParams>({
    status: "all",
    page: 1,
  });
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { data, isLoading, error, refetch } = useNovels(arId, filters);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleFiltersChange = (newFilters: NovelFilterParams) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  if (isLoading && !refreshing && !data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <NovelListSkeleton />
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
  const ar = data?.ar;
  const pagination = data?.pagination;

  return (
    <>
      <Stack.Screen
        options={{
          title: ar?.level || "Novels",
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <FlatList
          ref={flatListRef}
          data={novels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NovelCard novel={item} arId={arId} />}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              {/* AR Info Header */}
              {ar && (
                <View className="mb-4">
                  <View className="mb-2 flex-row items-center gap-2">
                    <Text className="text-2xl font-bold text-foreground">
                      {ar.level}
                    </Text>
                    <StarRating stars={ar.stars} />
                  </View>
                  <View className="mb-2 flex-row gap-2">
                    <View className="rounded-full bg-primary/10 px-2 py-1">
                      <Text className="text-xs font-medium text-primary">
                        {ar.score}
                      </Text>
                    </View>
                    {pagination && (
                      <View className="rounded-full bg-muted px-2 py-1">
                        <Text className="text-xs text-muted-foreground">
                          {pagination.totalCount} novel
                          {pagination.totalCount !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    )}
                  </View>
                  {ar.description && (
                    <Text className="text-sm text-muted-foreground">
                      {ar.description}
                    </Text>
                  )}
                </View>
              )}

              {/* Filters */}
              <NovelFilters filters={filters} onFiltersChange={handleFiltersChange} />
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
            pagination && pagination.totalPages > 1 ? (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            ) : null
          }
        />
      </SafeAreaView>
    </>
  );
}
