import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

import { StarRating } from "@/components/common/StarRating";
import type { RCLevel } from "@/types/rc";

interface RCLevelCardProps {
  rcLevel: RCLevel;
}

export function RCLevelCard({ rcLevel }: RCLevelCardProps) {
  const router = useRouter();

  const firstTryPercentage =
    rcLevel.firstTryTotal > 0
      ? Math.round((rcLevel.firstTryCorrect / rcLevel.firstTryTotal) * 100)
      : 0;

  const handlePress = () => {
    router.push(`/rc/${rcLevel.id}`);
  };

  return (
    <TouchableOpacity
      className="rounded-2xl bg-white p-4 shadow-sm"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header Row */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-foreground">
          {rcLevel.level}
        </Text>
        <StarRating stars={rcLevel.stars} />
      </View>

      {/* Badges Row */}
      <View className="mb-3 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-primary/10 px-2 py-1">
          <Text className="text-xs font-medium text-primary">
            {rcLevel.relevantGrade}
          </Text>
        </View>
        <View className="rounded-full bg-muted px-2 py-1">
          <Text className="text-xs text-muted-foreground">
            {rcLevel.keywordCount} keyword{rcLevel.keywordCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Medal Images */}
      {rcLevel.medalImages.length > 0 && (
        <View className="mb-3 flex-row gap-2">
          {rcLevel.medalImages.map((medal, index) => (
            <Image
              key={index}
              source={{ uri: medal.imageUrl }}
              className="h-8 w-8"
              resizeMode="contain"
            />
          ))}
        </View>
      )}

      {/* First Try Progress */}
      {rcLevel.firstTryTotal > 0 && (
        <View className="mb-3">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground">First Try</Text>
            <Text className="text-xs font-medium text-foreground">
              {rcLevel.firstTryCorrect}/{rcLevel.firstTryTotal} (
              {firstTryPercentage}%)
            </Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full bg-green-500"
              style={{ width: `${firstTryPercentage}%` }}
            />
          </View>
        </View>
      )}

      {/* Description */}
      {rcLevel.description && (
        <Text className="text-sm text-muted-foreground" numberOfLines={2}>
          {rcLevel.description}
        </Text>
      )}

      {/* Keywords Attempted */}
      {rcLevel.keywordsAttempted > 0 && (
        <Text className="mt-2 text-xs text-muted-foreground">
          {rcLevel.keywordsAttempted} keyword
          {rcLevel.keywordsAttempted !== 1 ? "s" : ""} attempted
        </Text>
      )}
    </TouchableOpacity>
  );
}
