import { Text, View } from "react-native";

import { StarRating } from "@/components/common/StarRating";
import type { RCLevelInfo } from "@/types/rc";

interface RCLevelHeaderProps {
  rcLevel: RCLevelInfo;
}

export function RCLevelHeader({ rcLevel }: RCLevelHeaderProps) {
  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">
            {rcLevel.level}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {rcLevel.relevantGrade}
          </Text>
        </View>
        <StarRating stars={rcLevel.stars} size={20} />
      </View>
      {rcLevel.description && (
        <Text className="mt-2 text-sm text-muted-foreground">
          {rcLevel.description}
        </Text>
      )}
    </View>
  );
}
