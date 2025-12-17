import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Pagination } from "@/components/common";

import {
  RCFilters,
  RCKeywordCard,
  RCKeywordsSkeleton,
  RCLevelHeader,
} from "@/components/rc";
import { useRCKeywords, type RCFilterParams } from "@/hooks/useRC";

export default function RCKeywordsScreen() {
  const { rcLevelId } = useLocalSearchParams<{ rcLevelId: string }>();
  const [filters, setFilters] = useState<RCFilterParams>({
    status: "all",
    page: 1,
  });
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { data, isLoading, error, refetch } = useRCKeywords(rcLevelId, filters);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleFiltersChange = (newFilters: RCFilterParams) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  if (isLoading && !refreshing && !data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="p-4">
          <RCKeywordsSkeleton />
        </View>
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

  const keywords = data?.keywords || [];
  const rcLevel = data?.rcLevel;
  const pagination = data?.pagination;

  return (
    <>
      <Stack.Screen
        options={{
          title: rcLevel?.level || "Keywords",
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <FlatList
          ref={flatListRef}
          data={keywords}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RCKeywordCard keyword={item} rcLevelId={rcLevelId} />
          )}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              {/* RC Level Info Header */}
              {rcLevel && <RCLevelHeader rcLevel={rcLevel} />}

              {/* Keyword Count */}
              {pagination && (
                <View className="mb-4">
                  <Text className="text-sm text-muted-foreground">
                    {pagination.totalCount} keyword
                    {pagination.totalCount !== 1 ? "s" : ""} available
                  </Text>
                </View>
              )}

              {/* Filters */}
              <RCFilters filters={filters} onFiltersChange={handleFiltersChange} />
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-lg font-medium text-foreground">
                No keywords found
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
