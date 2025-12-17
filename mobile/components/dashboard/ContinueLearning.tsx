import FontAwesome from "@expo/vector-icons/FontAwesome";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { View, Text, TouchableOpacity } from "react-native";

import type {
  ContinueLearningNovel,
  ContinueLearningRC,
} from "@/services/api/dashboard";

interface ContinueLearningProps {
  novel: ContinueLearningNovel | null;
  rc: ContinueLearningRC | null;
  onNovelPress?: () => void;
  onRCPress?: () => void;
}

export function ContinueLearning({
  novel,
  rc,
  onNovelPress,
  onRCPress,
}: ContinueLearningProps) {
  return (
    <View className="gap-3">
      {/* Novel Progress Card */}
      <TouchableOpacity
        className="rounded-2xl bg-white p-4 shadow-sm"
        onPress={onNovelPress}
        activeOpacity={0.7}
        disabled={!novel}
      >
        <View className="mb-3 flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <FontAwesome name="book" size={14} color="#5D3A29" />
          </View>
          <Text className="text-base font-semibold text-foreground">
            Continue Reading
          </Text>
        </View>

        {novel ? (
          <>
            <Text className="mb-1 text-lg font-semibold text-foreground" numberOfLines={1}>
              {novel.title}
            </Text>
            {novel.arLevel && (
              <Text className="mb-3 text-sm text-muted-foreground">
                AR Level: {novel.arLevel}
              </Text>
            )}

            {/* Progress Bar */}
            <View className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${novel.progress}%` }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">
                {novel.completedChapters}/{novel.totalChapters} chapters
              </Text>
              <Text className="text-sm font-medium text-primary">
                {novel.progress}%
              </Text>
            </View>
          </>
        ) : (
          <View className="py-4">
            <Text className="text-center text-muted-foreground">
              No novel in progress
            </Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Start reading a novel to track your progress
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* RC Progress Card */}
      <TouchableOpacity
        className="rounded-2xl bg-white p-4 shadow-sm"
        onPress={onRCPress}
        activeOpacity={0.7}
        disabled={!rc}
      >
        <View className="mb-3 flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <FontAwesome name="graduation-cap" size={14} color="#2563EB" />
          </View>
          <Text className="text-base font-semibold text-foreground">
            Continue RC Practice
          </Text>
        </View>

        {rc ? (
          <>
            <Text className="mb-1 text-lg font-semibold text-foreground">
              {rc.keyword}
            </Text>
            <Text className="mb-2 text-sm text-muted-foreground">
              RC Level: {rc.rcLevel}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Last practiced:{" "}
              {formatDistanceToNow(new Date(rc.lastPracticed), {
                addSuffix: true,
                locale: ko,
              })}
            </Text>
          </>
        ) : (
          <View className="py-4">
            <Text className="text-center text-muted-foreground">
              No RC practice in progress
            </Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Start practicing to improve your reading comprehension
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
