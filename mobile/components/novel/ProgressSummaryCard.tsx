import { Text, View } from "react-native";

interface ProgressSummaryCardProps {
  completedChapters: number;
  totalChapters: number;
  freeChapters: number;
  progress: number;
}

export function ProgressSummaryCard({
  completedChapters,
  totalChapters,
  freeChapters,
  progress,
}: ProgressSummaryCardProps) {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <Text className="mb-4 text-lg font-semibold text-foreground">
        Your Progress
      </Text>

      <View className="flex-row justify-around">
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary">
            {completedChapters}
          </Text>
          <Text className="text-xs text-muted-foreground">Completed</Text>
        </View>

        <View className="items-center">
          <Text className="text-2xl font-bold text-foreground">
            {totalChapters}
          </Text>
          <Text className="text-xs text-muted-foreground">Total</Text>
        </View>

        <View className="items-center">
          <Text className="text-2xl font-bold text-amber-600">{freeChapters}</Text>
          <Text className="text-xs text-muted-foreground">Free</Text>
        </View>

        <View className="items-center">
          <Text className="text-2xl font-bold text-green-600">{progress}%</Text>
          <Text className="text-xs text-muted-foreground">Progress</Text>
        </View>
      </View>
    </View>
  );
}
