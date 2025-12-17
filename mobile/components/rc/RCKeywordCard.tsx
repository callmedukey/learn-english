import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import type { RCKeyword } from "@/types/rc";

interface RCKeywordCardProps {
  keyword: RCKeyword;
  rcLevelId: string;
}

export function RCKeywordCard({ keyword, rcLevelId }: RCKeywordCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (keyword.comingSoon) return;
    router.push(`/rc/${rcLevelId}/${keyword.id}`);
  };

  // Determine try status badge
  const getTryStatus = () => {
    if (keyword.secondTryData) {
      const percentage = Math.round(
        (keyword.secondTryData.correctAnswers /
          keyword.secondTryData.totalQuestions) *
          100
      );
      return { text: `2nd: ${percentage}%`, color: "bg-purple-100 text-purple-700" };
    }
    if (keyword.firstTryData) {
      const percentage = Math.round(
        (keyword.firstTryData.correctAnswers /
          keyword.firstTryData.totalQuestions) *
          100
      );
      return { text: `1st: ${percentage}%`, color: "bg-blue-100 text-blue-700" };
    }
    return null;
  };

  const tryStatus = getTryStatus();

  return (
    <TouchableOpacity
      className={`rounded-2xl bg-white p-4 shadow-sm ${keyword.comingSoon ? "opacity-60" : ""}`}
      onPress={handlePress}
      activeOpacity={keyword.comingSoon ? 1 : 0.7}
      disabled={keyword.comingSoon}
    >
      {/* Title */}
      <Text
        className="mb-2 text-base font-semibold text-foreground"
        numberOfLines={2}
      >
        {keyword.name}
      </Text>

      {/* Badges */}
      <View className="mb-3 flex-row flex-wrap gap-2">
        {keyword.comingSoon && (
          <View className="rounded-full bg-amber-100 px-2 py-1">
            <Text className="text-xs font-medium text-amber-700">
              Coming Soon
            </Text>
          </View>
        )}
        {keyword.isFree && !keyword.comingSoon && (
          <View className="rounded-full bg-green-100 px-2 py-1">
            <Text className="text-xs font-medium text-green-700">Free</Text>
          </View>
        )}
        {keyword.isMonthlyChallenge && (
          <View className="rounded-full bg-purple-100 px-2 py-1">
            <Text className="text-xs font-medium text-purple-700">
              Challenge
            </Text>
          </View>
        )}
        {tryStatus && (
          <View className={`rounded-full px-2 py-1 ${tryStatus.color.split(" ")[0]}`}>
            <Text className={`text-xs font-medium ${tryStatus.color.split(" ")[1]}`}>
              {tryStatus.text}
            </Text>
          </View>
        )}
        <View className="rounded-full bg-muted px-2 py-1">
          <Text className="text-xs text-muted-foreground">
            {keyword.questionCount} question
            {keyword.questionCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {!keyword.comingSoon && (
        <View className="mb-2">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground">Progress</Text>
            <Text className="text-xs font-medium text-foreground">
              {keyword.completedQuestions}/{keyword.questionCount} (
              {keyword.progress}%)
            </Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${keyword.progress}%` }}
            />
          </View>
        </View>
      )}

      {/* Description */}
      {keyword.description && (
        <Text className="text-sm text-muted-foreground" numberOfLines={2}>
          {keyword.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}
