import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RCLevelCard, RCLevelsSkeleton } from "@/components/rc";
import { useRCLevels } from "@/hooks/useRC";

export default function RCScreen() {
  const { data, isLoading, error, refetch } = useRCLevels();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <RCLevelsSkeleton />
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

  const rcLevels = data?.rcLevels || [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <FlatList
        data={rcLevels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RCLevelCard rcLevel={item} />}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="mb-2">
            <Text className="mb-1 text-2xl font-bold text-foreground">
              Reading Comprehension
            </Text>
            <Text className="text-muted-foreground">
              Select a level to practice reading skills
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
