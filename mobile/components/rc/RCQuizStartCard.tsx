import { Text, TouchableOpacity, View } from "react-native";

interface RCQuizStartCardProps {
  questionCount: number;
  readingTimeLimit: number;
  isRetry: boolean;
  onStart: () => void;
  onCancel: () => void;
}

export function RCQuizStartCard({
  questionCount,
  readingTimeLimit,
  isRetry,
  onStart,
  onCancel,
}: RCQuizStartCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} seconds`;
    if (secs === 0) return `${mins} minute${mins !== 1 ? "s" : ""}`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View className="rounded-2xl bg-white p-6 shadow-sm">
      <View className="items-center gap-4">
        <Text className="text-5xl">📖</Text>

        <View className="items-center gap-2">
          <Text className="text-xl font-semibold text-foreground">
            Reading Comprehension Quiz
          </Text>
          <Text className="text-center text-muted-foreground">
            You&apos;ll first read a passage, then answer questions about it.
          </Text>
        </View>

        {/* Quiz Info */}
        <View className="w-full rounded-lg bg-muted/50 p-4">
          <View className="gap-2">
            <Text className="text-sm text-muted-foreground">
              • {formatTime(readingTimeLimit)} to read the passage
            </Text>
            <Text className="text-sm text-muted-foreground">
              • {questionCount} question{questionCount !== 1 ? "s" : ""} to
              answer
            </Text>
            <Text className="text-sm text-muted-foreground">
              • Each question has a time limit
            </Text>
            <Text className="text-sm text-muted-foreground">
              • You&apos;ll see explanations after each answer
            </Text>
            {isRetry && (
              <Text className="text-sm font-medium text-amber-600">
                • No points will be awarded for retry attempts
              </Text>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View className="w-full border-t border-border pt-4">
          <Text className="mb-2 font-medium text-foreground">How it works:</Text>
          <View className="gap-2">
            <View className="flex-row items-start gap-2">
              <Text className="text-primary">1.</Text>
              <Text className="flex-1 text-sm text-muted-foreground">
                Read the passage carefully during the reading phase
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-primary">2.</Text>
              <Text className="flex-1 text-sm text-muted-foreground">
                Click &quot;Start Questions&quot; when ready (or wait for timer)
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-primary">3.</Text>
              <Text className="flex-1 text-sm text-muted-foreground">
                Answer each question within the time limit
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View className="mt-2 w-full flex-row gap-3">
          <TouchableOpacity
            className="flex-1 rounded-lg border border-border py-3"
            onPress={onCancel}
          >
            <Text className="text-center font-medium text-foreground">
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-lg bg-primary py-3"
            onPress={onStart}
          >
            <Text className="text-center font-medium text-primary-foreground">
              Start Reading
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
