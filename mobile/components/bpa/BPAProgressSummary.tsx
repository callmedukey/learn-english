import { Text, View } from "react-native";

interface BPAProgressSummaryProps {
  totalChapters: number;
  completedChapters: number;
  freeChapters: number;
  progress: number;
}

export function BPAProgressSummary({
  totalChapters,
  completedChapters,
  freeChapters,
  progress,
}: BPAProgressSummaryProps) {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <Text className="mb-4 text-lg font-semibold text-foreground">
        Your Progress
      </Text>

      <View className="flex-row flex-wrap justify-between">
        {/* Completed */}
        <View className="mb-2 w-1/2 items-center">
          <Text className="text-2xl font-bold text-primary">
            {completedChapters}
          </Text>
          <Text className="text-sm text-muted-foreground">Completed</Text>
        </View>

        {/* Total */}
        <View className="mb-2 w-1/2 items-center">
          <Text className="text-2xl font-bold text-foreground">
            {totalChapters}
          </Text>
          <Text className="text-sm text-muted-foreground">Total Chapters</Text>
        </View>

        {/* Free */}
        <View className="w-1/2 items-center">
          <Text className="text-2xl font-bold text-amber-600">{freeChapters}</Text>
          <Text className="text-sm text-muted-foreground">Free Chapters</Text>
        </View>

        {/* Progress */}
        <View className="w-1/2 items-center">
          <Text className="text-2xl font-bold text-green-600">
            {Math.round(progress)}%
          </Text>
          <Text className="text-sm text-muted-foreground">Progress</Text>
        </View>
      </View>
    </View>
  );
}
