import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import type { BPALevel } from "@/types/bpa";

interface BPALevelCardProps {
  level: BPALevel;
}

export function BPALevelCard({ level }: BPALevelCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/bpa/${level.id}`);
  };

  // Generate star display
  const stars = "★".repeat(level.stars);

  return (
    <TouchableOpacity
      className={`rounded-2xl bg-white p-4 shadow-sm ${
        !level.isAssigned ? "opacity-60" : ""
      }`}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="mb-1 flex-row items-center gap-2">
            <Text className="text-lg font-semibold text-foreground">
              {level.name}
            </Text>
            <Text className="text-amber-500">{stars}</Text>
          </View>

          {level.description && (
            <Text
              className="mb-2 text-sm text-muted-foreground"
              numberOfLines={2}
            >
              {level.description}
            </Text>
          )}

          <View className="flex-row items-center gap-3">
            <View className="rounded-full bg-primary/10 px-2 py-0.5">
              <Text className="text-xs font-medium text-primary">
                {level.novelsAvailable} units
              </Text>
            </View>

            {level.isAssigned ? (
              <View className="rounded-full bg-green-100 px-2 py-0.5">
                <Text className="text-xs font-medium text-green-700">
                  Assigned
                </Text>
              </View>
            ) : (
              <View className="rounded-full bg-gray-100 px-2 py-0.5">
                <Text className="text-xs font-medium text-gray-600">
                  Not Assigned
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="ml-3">
          <Text className="text-2xl text-muted-foreground">›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
