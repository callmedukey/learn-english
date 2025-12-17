import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import type { BPAChapterDetails } from "@/types/bpa";

interface BPAChapterCardProps {
  chapter: BPAChapterDetails;
  levelId: string;
  novelId: string;
  userHasPaidSubscription: boolean;
}

export function BPAChapterCard({
  chapter,
  levelId,
  novelId,
  userHasPaidSubscription,
}: BPAChapterCardProps) {
  const router = useRouter();

  const canAccess = chapter.isFree || userHasPaidSubscription;

  const handlePress = () => {
    if (canAccess && chapter.hasQuiz) {
      router.push(`/bpa/${levelId}/${novelId}/${chapter.id}`);
    }
  };

  // Determine status for display
  const getStatusBadge = () => {
    if (!chapter.hasQuiz) {
      return (
        <View className="rounded-full bg-gray-100 px-2 py-0.5">
          <Text className="text-xs font-medium text-gray-600">No Quiz</Text>
        </View>
      );
    }

    if (chapter.isCompleted) {
      return (
        <View className="rounded-full bg-green-100 px-2 py-0.5">
          <Text className="text-xs font-medium text-green-700">Completed</Text>
        </View>
      );
    }

    if (chapter.completedQuestions > 0) {
      return (
        <View className="rounded-full bg-amber-100 px-2 py-0.5">
          <Text className="text-xs font-medium text-amber-700">In Progress</Text>
        </View>
      );
    }

    return null;
  };

  // Get try data display
  const getTryDisplay = () => {
    if (!chapter.firstTryData) return null;

    const firstTryScore = `${chapter.firstTryData.correctAnswers}/${chapter.firstTryData.totalQuestions}`;
    const secondTryScore = chapter.secondTryData
      ? `${chapter.secondTryData.correctAnswers}/${chapter.secondTryData.totalQuestions}`
      : null;

    return (
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-muted-foreground">1st:</Text>
          <Text className="text-xs font-medium text-foreground">
            {firstTryScore}
          </Text>
        </View>
        {secondTryScore && (
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-muted-foreground">2nd:</Text>
            <Text className="text-xs font-medium text-foreground">
              {secondTryScore}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      className={`rounded-2xl bg-white p-4 shadow-sm ${
        !canAccess ? "opacity-60" : ""
      }`}
      onPress={handlePress}
      activeOpacity={canAccess && chapter.hasQuiz ? 0.7 : 1}
      disabled={!canAccess || !chapter.hasQuiz}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          {/* Chapter number and title */}
          <View className="mb-1 flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <Text className="text-xs font-medium text-primary">
                {chapter.orderNumber}
              </Text>
            </View>
            <Text
              className="flex-1 text-base font-medium text-foreground"
              numberOfLines={1}
            >
              {chapter.title}
            </Text>
          </View>

          {/* Description */}
          {chapter.description && (
            <Text
              className="mb-2 text-sm text-muted-foreground"
              numberOfLines={2}
            >
              {chapter.description}
            </Text>
          )}

          {/* Badges */}
          <View className="flex-row flex-wrap items-center gap-2">
            {chapter.isFree && (
              <View className="rounded-full bg-green-100 px-2 py-0.5">
                <Text className="text-xs font-medium text-green-700">Free</Text>
              </View>
            )}

            {!canAccess && (
              <View className="rounded-full bg-amber-100 px-2 py-0.5">
                <Text className="text-xs font-medium text-amber-700">
                  Premium
                </Text>
              </View>
            )}

            {getStatusBadge()}

            {chapter.hasQuiz && (
              <View className="rounded-full bg-muted px-2 py-0.5">
                <Text className="text-xs font-medium text-muted-foreground">
                  {chapter.totalQuestions} questions
                </Text>
              </View>
            )}
          </View>

          {/* Try data */}
          {getTryDisplay() && (
            <View className="mt-2">{getTryDisplay()}</View>
          )}
        </View>

        {/* Arrow */}
        {canAccess && chapter.hasQuiz && (
          <View className="ml-2">
            <Text className="text-xl text-muted-foreground">›</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
