import FontAwesome from "@expo/vector-icons/FontAwesome";
import { View, Text, TouchableOpacity } from "react-native";

import type {
  AllTimeStats,
  MonthlyStats,
  MedalCounts,
} from "@/services/api/dashboard";

interface MyStatsCardProps {
  title: string;
  stats: AllTimeStats | MonthlyStats;
  showMedals?: boolean;
  onPress?: () => void;
}

function StatRow({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <View className="flex-row items-center gap-2">
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Text className="text-sm text-muted-foreground">{label}</Text>
      </View>
      <Text className="font-medium text-foreground">
        {score.toLocaleString()} pts
      </Text>
    </View>
  );
}

function MedalsDisplay({ medals }: { medals: MedalCounts }) {
  const totalMedals = medals.gold + medals.silver + medals.bronze;

  if (totalMedals === 0) {
    return null;
  }

  return (
    <View className="mt-3 flex-row items-center justify-center gap-4 border-t border-border pt-3">
      <View className="flex-row items-center gap-1">
        <Text className="text-base">🥇</Text>
        <Text className="font-medium text-foreground">{medals.gold}</Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Text className="text-base">🥈</Text>
        <Text className="font-medium text-foreground">{medals.silver}</Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Text className="text-base">🥉</Text>
        <Text className="font-medium text-foreground">{medals.bronze}</Text>
      </View>
    </View>
  );
}

export function MyStatsCard({ title, stats, showMedals = false, onPress }: MyStatsCardProps) {
  const isAllTimeStats = "medals" in stats;

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Container className="rounded-2xl bg-white p-4 shadow-sm" {...containerProps}>
      {/* Header */}
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-green-100">
          <FontAwesome name="bar-chart" size={14} color="#16A34A" />
        </View>
        <Text className="text-base font-semibold text-foreground">{title}</Text>
      </View>

      {/* Score Stats */}
      <View className="mb-3">
        <StatRow label="NOVEL" score={stats.novelScore} color="#5D3A29" />
        <StatRow label="R.C" score={stats.rcScore} color="#2563EB" />
        <View className="mt-2 border-t border-border pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-foreground">TOTAL</Text>
            <Text className="text-lg font-bold text-primary">
              {stats.totalScore.toLocaleString()} pts
            </Text>
          </View>
        </View>
      </View>

      {/* Rankings */}
      <View className="rounded-lg bg-muted/50 p-3">
        {stats.overallRank.rank > 0 ? (
          <>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Overall Rank</Text>
              <Text className="font-medium text-foreground">
                #{stats.overallRank.rank}{" "}
                <Text className="text-muted-foreground">
                  (Top {stats.overallRank.percentile}%)
                </Text>
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">
                {stats.gradeRank.grade} Rank
              </Text>
              <Text className="font-medium text-foreground">
                #{stats.gradeRank.rank}{" "}
                <Text className="text-muted-foreground">
                  (Top {stats.gradeRank.percentile}%)
                </Text>
              </Text>
            </View>
          </>
        ) : (
          <Text className="text-center text-sm text-muted-foreground">
            Complete activities to get ranked!
          </Text>
        )}
      </View>

      {/* Medals (only for all-time stats) */}
      {showMedals && isAllTimeStats && <MedalsDisplay medals={stats.medals} />}
    </Container>
  );
}
