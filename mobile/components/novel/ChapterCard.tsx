import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import type { ChapterDetails } from "@/types/novel";

interface ChapterCardProps {
  chapter: ChapterDetails;
  arId: string;
  novelId: string;
  userHasPaidSubscription: boolean;
}

export function ChapterCard({
  chapter,
  arId,
  novelId,
  userHasPaidSubscription,
}: ChapterCardProps) {
  const router = useRouter();

  const canAccess = chapter.isFree || userHasPaidSubscription;
  const hasQuiz = chapter.hasQuiz && chapter.isQuizActive;

  // Determine button state
  let buttonText = "Start Quiz";
  let buttonVariant: "primary" | "secondary" | "disabled" = "primary";

  if (!hasQuiz) {
    buttonText = "No Quiz";
    buttonVariant = "disabled";
  } else if (!canAccess) {
    buttonText = "Premium";
    buttonVariant = "disabled";
  } else if (chapter.firstTryData && chapter.secondTryData) {
    buttonText = "Retry";
    buttonVariant = "secondary";
  } else if (chapter.firstTryData) {
    buttonText = "Second Try";
    buttonVariant = "secondary";
  } else if (chapter.completedQuestions > 0) {
    buttonText = "Continue";
    buttonVariant = "primary";
  }

  const handlePress = () => {
    if (!canAccess || !hasQuiz) return;
    router.push(`/novel/${arId}/${novelId}/${chapter.id}`);
  };

  // Calculate first try percentage
  const firstTryPercentage = chapter.firstTryData
    ? Math.round(
        (chapter.firstTryData.correctAnswers /
          chapter.firstTryData.totalQuestions) *
          100
      )
    : 0;

  // Calculate second try percentage
  const secondTryPercentage = chapter.secondTryData
    ? Math.round(
        (chapter.secondTryData.correctAnswers /
          chapter.secondTryData.totalQuestions) *
          100
      )
    : 0;

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Header */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-foreground">
          Chapter {chapter.orderNumber}
        </Text>
        <View className="flex-row gap-2">
          {chapter.isFree ? (
            <View className="rounded-full bg-green-100 px-2 py-1">
              <Text className="text-xs font-medium text-green-700">Free</Text>
            </View>
          ) : (
            <View className="rounded-full bg-amber-100 px-2 py-1">
              <Text className="text-xs font-medium text-amber-700">Premium</Text>
            </View>
          )}
        </View>
      </View>

      {/* Title */}
      <Text className="mb-3 text-sm text-muted-foreground" numberOfLines={2}>
        {chapter.title}
      </Text>

      {/* Try Badges */}
      {(chapter.firstTryData || chapter.secondTryData) && (
        <View className="mb-3 flex-row gap-2">
          {chapter.firstTryData && (
            <View
              className={`rounded-full px-2 py-1 ${
                firstTryPercentage >= 80
                  ? "bg-green-100"
                  : firstTryPercentage >= 50
                    ? "bg-amber-100"
                    : "bg-red-100"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  firstTryPercentage >= 80
                    ? "text-green-700"
                    : firstTryPercentage >= 50
                      ? "text-amber-700"
                      : "text-red-700"
                }`}
              >
                1st: {chapter.firstTryData.correctAnswers}/
                {chapter.firstTryData.totalQuestions}
              </Text>
            </View>
          )}
          {chapter.secondTryData && (
            <View
              className={`rounded-full px-2 py-1 ${
                secondTryPercentage >= 80
                  ? "bg-green-100"
                  : secondTryPercentage >= 50
                    ? "bg-amber-100"
                    : "bg-red-100"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  secondTryPercentage >= 80
                    ? "text-green-700"
                    : secondTryPercentage >= 50
                      ? "text-amber-700"
                      : "text-red-700"
                }`}
              >
                2nd: {chapter.secondTryData.correctAnswers}/
                {chapter.secondTryData.totalQuestions}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Progress Bar (if questions exist and not fully completed) */}
      {chapter.totalQuestions > 0 &&
        !chapter.isCompleted &&
        chapter.completedQuestions > 0 && (
          <View className="mb-3">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">Progress</Text>
              <Text className="text-xs font-medium text-foreground">
                {chapter.completedQuestions}/{chapter.totalQuestions}
              </Text>
            </View>
            <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${(chapter.completedQuestions / chapter.totalQuestions) * 100}%`,
                }}
              />
            </View>
          </View>
        )}

      {/* Action Button */}
      <TouchableOpacity
        className={`rounded-lg py-3 ${
          buttonVariant === "primary"
            ? "bg-primary"
            : buttonVariant === "secondary"
              ? "bg-muted"
              : "bg-gray-200"
        }`}
        onPress={handlePress}
        disabled={buttonVariant === "disabled"}
        activeOpacity={0.7}
      >
        <Text
          className={`text-center text-sm font-medium ${
            buttonVariant === "primary"
              ? "text-primary-foreground"
              : buttonVariant === "secondary"
                ? "text-foreground"
                : "text-muted-foreground"
          }`}
        >
          {!canAccess && hasQuiz ? "🔒 " : ""}
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
