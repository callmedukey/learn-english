import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import type { BPANovelListItem } from "@/types/bpa";

interface BPANovelCardProps {
  novel: BPANovelListItem;
  levelId: string;
}

export function BPANovelCard({ novel, levelId }: BPANovelCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (novel.isAccessible) {
      router.push(`/bpa/${levelId}/${novel.id}`);
    }
  };

  const progressPercentage = novel.progress;

  return (
    <TouchableOpacity
      className={`rounded-2xl bg-white p-4 shadow-sm ${
        !novel.isAccessible ? "opacity-60" : ""
      }`}
      onPress={handlePress}
      activeOpacity={novel.isAccessible ? 0.7 : 1}
      disabled={!novel.isAccessible}
    >
      <View>
        {/* Title */}
        <Text
          className="mb-2 text-base font-semibold text-foreground"
          numberOfLines={2}
        >
          {novel.title}
        </Text>

        {/* Description */}
        {novel.description && (
          <Text
            className="mb-3 text-sm text-muted-foreground"
            numberOfLines={2}
          >
            {novel.description}
          </Text>
        )}

        {/* Stats */}
        <View className="mb-3 flex-row items-center gap-2">
          <View className="rounded-full bg-muted px-2 py-0.5">
            <Text className="text-xs font-medium text-muted-foreground">
              {novel.totalChapters} chapters
            </Text>
          </View>

          {novel.comingSoon && (
            <View className="rounded-full bg-amber-100 px-2 py-0.5">
              <Text className="text-xs font-medium text-amber-700">
                Coming Soon
              </Text>
            </View>
          )}
        </View>

        {/* Progress or Access Status */}
        {novel.isAccessible ? (
          novel.totalChapters > 0 && (
            <View>
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">Progress</Text>
                <Text className="text-xs font-medium text-foreground">
                  {novel.completedChapters}/{novel.totalChapters}
                </Text>
              </View>
              <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPercentage}%` }}
                />
              </View>
            </View>
          )
        ) : (
          <View className="rounded-lg bg-gray-100 py-2">
            <Text className="text-center text-sm font-medium text-gray-600">
              Not Your Level
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
