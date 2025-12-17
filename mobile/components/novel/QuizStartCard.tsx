import { Text, TouchableOpacity, View } from "react-native";

import { HtmlContent } from "./HtmlContent";

const INSTRUCTIONS_STYLE = { fontSize: 14, color: "#6B7280" };

interface QuizStartCardProps {
  questionCount: number;
  instructions: string | null;
  isRetry: boolean;
  onStart: () => void;
  onCancel: () => void;
}

export function QuizStartCard({
  questionCount,
  instructions,
  isRetry,
  onStart,
  onCancel,
}: QuizStartCardProps) {
  return (
    <View className="rounded-2xl bg-white p-6 shadow-sm">
      <View className="items-center gap-4">
        <Text className="text-5xl">🚀</Text>

        <View className="items-center gap-2">
          <Text className="text-xl font-semibold text-foreground">
            Ready to Start?
          </Text>
          <Text className="text-center text-muted-foreground">
            Once you click start, the timer will begin for each question.
          </Text>
        </View>

        {/* Quiz Info */}
        <View className="w-full rounded-lg bg-muted/50 p-4">
          <View className="gap-2">
            <Text className="text-sm text-muted-foreground">
              • {questionCount} question{questionCount !== 1 ? "s" : ""} total
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
        {instructions && (
          <View className="w-full border-t border-border pt-4">
            <Text className="mb-2 font-medium text-foreground">
              Instructions:
            </Text>
            <HtmlContent html={instructions} baseStyle={INSTRUCTIONS_STYLE} />
          </View>
        )}

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
              Start Quiz
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
