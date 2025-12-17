import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import type { NovelListItem } from "@/types/novel";

interface NovelCardProps {
  novel: NovelListItem;
  arId: string;
}

export function NovelCard({ novel, arId }: NovelCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (novel.comingSoon) return;
    router.push(`/novel/${arId}/${novel.id}`);
  };

  return (
    <TouchableOpacity
      className={`rounded-2xl bg-white p-4 shadow-sm ${novel.comingSoon ? "opacity-60" : ""}`}
      onPress={handlePress}
      activeOpacity={novel.comingSoon ? 1 : 0.7}
      disabled={novel.comingSoon}
    >
      {/* Title */}
      <Text className="mb-2 text-base font-semibold text-foreground" numberOfLines={2}>
        {novel.title}
      </Text>

      {/* Badges */}
      <View className="mb-3 flex-row flex-wrap gap-2">
        {novel.comingSoon && (
          <View className="rounded-full bg-amber-100 px-2 py-1">
            <Text className="text-xs font-medium text-amber-700">Coming Soon</Text>
          </View>
        )}
        {novel.freeChapters > 0 && !novel.comingSoon && (
          <View className="rounded-full bg-green-100 px-2 py-1">
            <Text className="text-xs font-medium text-green-700">
              {novel.freeChapters} Free Chapter{novel.freeChapters !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
        {novel.isMonthlyChallenge && (
          <View className="rounded-full bg-purple-100 px-2 py-1">
            <Text className="text-xs font-medium text-purple-700">Challenge</Text>
          </View>
        )}
        <View className="rounded-full bg-muted px-2 py-1">
          <Text className="text-xs text-muted-foreground">
            {novel.totalChapters} Chapter{novel.totalChapters !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {!novel.comingSoon && (
        <View className="mb-2">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground">Progress</Text>
            <Text className="text-xs font-medium text-foreground">
              {novel.completedChapters}/{novel.totalChapters} ({novel.progress}%)
            </Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${novel.progress}%` }}
            />
          </View>
        </View>
      )}

      {/* Description */}
      {novel.description && (
        <Text className="text-sm text-muted-foreground" numberOfLines={2}>
          {novel.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}
