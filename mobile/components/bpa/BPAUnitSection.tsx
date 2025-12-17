import { Text, View } from "react-native";

import type { BPAUnit } from "@/types/bpa";

import { BPAChapterCard } from "./BPAChapterCard";

interface BPAUnitSectionProps {
  unit: BPAUnit;
  levelId: string;
  novelId: string;
  userHasPaidSubscription: boolean;
}

export function BPAUnitSection({
  unit,
  levelId,
  novelId,
  userHasPaidSubscription,
}: BPAUnitSectionProps) {
  return (
    <View className="mb-6">
      {/* Unit Header */}
      <View className="mb-4">
        <Text className="text-xl font-bold text-foreground">{unit.name}</Text>
        {unit.description && (
          <Text className="mt-1 text-sm text-muted-foreground">
            {unit.description}
          </Text>
        )}
      </View>

      {/* Unit Chapters */}
      {unit.chapters.length > 0 ? (
        <View className="gap-3">
          {unit.chapters.map((chapter) => (
            <BPAChapterCard
              key={chapter.id}
              chapter={chapter}
              levelId={levelId}
              novelId={novelId}
              userHasPaidSubscription={userHasPaidSubscription}
            />
          ))}
        </View>
      ) : (
        <View className="rounded-xl bg-muted/50 p-4">
          <Text className="text-center text-sm text-muted-foreground">
            No chapters in this unit yet.
          </Text>
        </View>
      )}
    </View>
  );
}
