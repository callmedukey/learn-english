import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ARCard, ARLevelsSkeleton } from "@/components/novel";
import { useARLevels } from "@/hooks/useNovel";

export default function NovelScreen() {
  const { data, isLoading, error, refetch } = useARLevels();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <ARLevelsSkeleton />
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

  const arLevels = data?.arLevels || [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <FlatList
        data={arLevels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ARCard ar={item} />}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="mb-2">
            <Text className="mb-1 text-2xl font-bold text-foreground">
              Choose Your Level
            </Text>
            <Text className="text-muted-foreground">
              Select a reading level to explore novels
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-muted-foreground">No levels available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
