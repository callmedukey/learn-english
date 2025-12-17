import { Text, TouchableOpacity, View } from "react-native";

interface RCQuizResultProps {
  correctAnswers: number;
  totalQuestions: number;
  pointsEarned: number;
  isRetry: boolean;
  onRetry: () => void;
  onBackToKeywords: () => void;
}

export function RCQuizResult({
  correctAnswers,
  totalQuestions,
  pointsEarned,
  isRetry,
  onRetry,
  onBackToKeywords,
}: RCQuizResultProps) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  return (
    <View className="rounded-2xl bg-white p-6 shadow-sm">
      <View className="items-center gap-4">
        <Text className="text-5xl">
          {percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "📚"}
        </Text>

        <Text className="text-xl font-semibold text-foreground">
          Quiz Completed!
        </Text>

        {/* Score Display */}
        <View className="flex-row gap-4">
          {/* Correct Answers */}
          <View className="items-center rounded-2xl border-2 border-primary/20 bg-primary/10 px-6 py-4">
            <Text className="text-2xl font-bold text-primary">
              {correctAnswers}/{totalQuestions}
            </Text>
            <Text className="text-sm font-medium text-primary/80">Correct</Text>
          </View>

          {/* Points (if not retry) */}
          {!isRetry && (
            <View className="items-center rounded-2xl border-2 border-amber-500/20 bg-amber-500/10 px-6 py-4">
              <Text className="text-2xl font-bold text-amber-600">
                {pointsEarned}
              </Text>
              <Text className="text-sm font-medium text-amber-600/80">
                Points
              </Text>
            </View>
          )}
        </View>

        {/* Percentage */}
        <View className="w-full rounded-lg bg-muted/50 px-4 py-3">
          <Text className="text-center text-lg font-semibold text-foreground">
            {percentage}%
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            {percentage >= 80
              ? "Excellent work!"
              : percentage >= 50
                ? "Good effort!"
                : "Keep practicing!"}
          </Text>
        </View>

        {/* Status Message */}
        <View className="rounded-lg bg-muted/50 px-4 py-2">
          {isRetry ? (
            <Text className="text-center text-sm text-amber-600">
              Retry mode - no points awarded
            </Text>
          ) : pointsEarned > 0 ? (
            <Text className="text-center text-sm text-green-600">
              Great job! You earned {pointsEarned} points
            </Text>
          ) : (
            <Text className="text-center text-sm text-muted-foreground">
              Keep practicing to improve your score!
            </Text>
          )}
        </View>

        {/* Buttons */}
        <View className="mt-4 w-full gap-3">
          <TouchableOpacity
            className="rounded-lg border border-border py-3"
            onPress={onRetry}
          >
            <Text className="text-center font-medium text-foreground">
              Retry Quiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-lg bg-primary py-3"
            onPress={onBackToKeywords}
          >
            <Text className="text-center font-medium text-primary-foreground">
              Back to Keywords
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
