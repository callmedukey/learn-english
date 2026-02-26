import FontAwesome from "@expo/vector-icons/FontAwesome";
import { View, Text, TouchableOpacity } from "react-native";

import type {
  AllTimeStats,
  MonthlyStats,
  MedalCounts,
  TodayStats,
} from "@/services/api/dashboard";

interface MyStatsCardProps {
  title: string;
  stats: AllTimeStats | MonthlyStats;
  showMedals?: boolean;
  onPress?: () => void;
  onHistoryPress?: () => void;
}

function StatSection({
  label,
  totalScore,
  todayScore,
}: {
  label: string;
  totalScore: number;
  todayScore: number;
}) {
  return (
    <View className="gap-1">
      <Text className="text-center text-base font-bold text-primary">{label}</Text>
      <View className="flex-row gap-2">
        <View className="flex-1 rounded-lg bg-gray-100 p-2">
          <Text className="text-center text-xs text-gray-500">Total</Text>
          <Text className="text-center text-sm font-bold text-gray-800">
            {totalScore.toLocaleString()}
          </Text>
        </View>
        <View className="flex-1 rounded-lg bg-green-50 p-2">
          <Text className="text-center text-xs text-green-600">Today</Text>
          <Text className="text-center text-sm font-bold text-green-600">
            +{todayScore.toLocaleString()}
          </Text>
        </View>
      </View>
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

export function MyStatsCard({ title, stats, showMedals = false, onPress, onHistoryPress }: MyStatsCardProps) {
  const isAllTimeStats = "medals" in stats;

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Container className="rounded-2xl bg-white p-4 shadow-sm" {...containerProps}>
      {/* Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <FontAwesome name="bar-chart" size={14} color="#16A34A" />
          </View>
          <Text className="text-base font-semibold text-foreground">{title}</Text>
        </View>
        {onHistoryPress && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onHistoryPress();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1"
          >
            <FontAwesome name="history" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Score Stats */}
      <View className="mb-3 gap-3">
        <StatSection
          label="NOVEL"
          totalScore={stats.novelScore}
          todayScore={stats.todayStats.novelScore}
        />
        <StatSection
          label="R.C"
          totalScore={stats.rcScore}
          todayScore={stats.todayStats.rcScore}
        />
        <StatSection
          label="TOTAL"
          totalScore={stats.totalScore}
          todayScore={stats.todayStats.totalScore}
        />
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
