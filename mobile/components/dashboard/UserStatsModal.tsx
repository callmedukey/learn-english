import FontAwesome from "@expo/vector-icons/FontAwesome";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";

import {
  Dialog,
  DialogContent,
  DialogCloseButton,
} from "@/components/ui/Dialog";
import { useUserStats } from "@/hooks/useUserStats";

interface UserStatsModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatRow({
  label,
  score,
  count,
}: {
  label: string;
  score: number;
  count: number;
}) {
  return (
    <View className="flex-row items-center justify-between py-0.5">
      <Text className="text-xs text-gray-700">{label}</Text>
      <Text className="text-xs font-medium text-gray-900">
        {score.toLocaleString()} ({count})
      </Text>
    </View>
  );
}

function SectionHeader({
  title,
  total,
}: {
  title: string;
  total?: number;
}) {
  return (
    <Text className="mb-1 text-xs font-semibold text-primary">
      {title}
      {total !== undefined && ` - Total: ${total.toLocaleString()}`}
    </Text>
  );
}

function MedalDisplay({
  gold,
  silver,
  bronze,
}: {
  gold: number;
  silver: number;
  bronze: number;
}) {
  const total = gold + silver + bronze;

  if (total === 0) {
    return (
      <View className="items-center py-2">
        <Text className="text-xs text-gray-500">No medals earned yet</Text>
        <Text className="mt-1 text-xs text-gray-400">
          Compete in monthly challenges to earn medals!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-center gap-6 py-2">
      <View className="flex-row items-center gap-1">
        <Text className="text-base">🥇</Text>
        <Text className="font-medium text-gray-900">{gold}</Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Text className="text-base">🥈</Text>
        <Text className="font-medium text-gray-900">{silver}</Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Text className="text-base">🥉</Text>
        <Text className="font-medium text-gray-900">{bronze}</Text>
      </View>
    </View>
  );
}

export function UserStatsModal({
  userId,
  open,
  onOpenChange,
}: UserStatsModalProps) {
  const { data: userStats, isLoading, error } = useUserStats(open ? userId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxHeight: "80%", padding: 0 }}>
        <DialogCloseButton onPress={() => onOpenChange(false)} />

        {isLoading && (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#5D3A29" />
            <Text className="mt-2 text-sm text-gray-500">Loading stats...</Text>
          </View>
        )}

        {error && (
          <View className="items-center justify-center py-12">
            <FontAwesome name="exclamation-circle" size={32} color="#EF4444" />
            <Text className="mt-2 text-sm text-gray-500">
              Failed to load user stats
            </Text>
          </View>
        )}

        {userStats && (
          <ScrollView
            className="p-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Header */}
            <View className="mb-3 pr-8">
              <Text className="text-base font-semibold text-gray-900">
                {userStats.nickname}
              </Text>
              <Text className="text-xs text-gray-600">{userStats.grade}</Text>

              {/* Ranking Badges */}
              {userStats.ranking && (
                <View className="mt-2 gap-1">
                  <View className="rounded bg-primary px-2 py-1">
                    <Text className="text-center text-xs font-bold text-white">
                      {userStats.ranking.overallRankingPercentage} Overall
                    </Text>
                  </View>
                  <View className="rounded bg-amber-500 px-2 py-1">
                    <Text className="text-center text-xs font-bold text-white">
                      {userStats.ranking.gradeRankingPercentage} in{" "}
                      {userStats.grade}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Novel Stats */}
            <View className="mb-3">
              <SectionHeader title="NOVEL" total={userStats.totalArScore} />
              {userStats.arStats.length > 0 ? (
                userStats.arStats.map((stat) => (
                  <StatRow
                    key={stat.level}
                    label={stat.level}
                    score={stat.score}
                    count={stat.count}
                  />
                ))
              ) : (
                <Text className="text-xs text-gray-500">No AR scores yet</Text>
              )}
            </View>

            {/* VIP Scores (BPA) */}
            <View className="mb-3">
              <SectionHeader
                title="VIP SCORES (BPA)"
                total={userStats.totalBpaScore}
              />
              {userStats.bpaStats.length > 0 ? (
                userStats.bpaStats.map((stat) => (
                  <StatRow
                    key={stat.level}
                    label={stat.level}
                    score={stat.score}
                    count={stat.count}
                  />
                ))
              ) : (
                <Text className="text-xs text-gray-500">No VIP scores yet</Text>
              )}
            </View>

            {/* RC Stats */}
            <View className="mb-3">
              <SectionHeader
                title="READING COMPREHENSION"
                total={userStats.totalRcScore}
              />
              {userStats.rcStats.length > 0 ? (
                userStats.rcStats.map((stat) => (
                  <StatRow
                    key={stat.level}
                    label={stat.level}
                    score={stat.score}
                    count={stat.count}
                  />
                ))
              ) : (
                <Text className="text-xs text-gray-500">No RC scores yet</Text>
              )}
            </View>

            {/* Total */}
            <View className="mb-3 border-t border-gray-200 pt-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-gray-900">
                  TOTAL SCORE
                </Text>
                <Text className="text-sm font-bold text-primary">
                  {(
                    userStats.totalArScore +
                    userStats.totalBpaScore +
                    userStats.totalRcScore
                  ).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Medals */}
            <View className="border-t border-gray-200 pt-2">
              <SectionHeader
                title={`MEDALS${
                  userStats.medals
                    ? ` (${
                        userStats.medals.totalGold +
                        userStats.medals.totalSilver +
                        userStats.medals.totalBronze
                      } total)`
                    : ""
                }`}
              />
              {userStats.medals && (
                <MedalDisplay
                  gold={userStats.medals.totalGold}
                  silver={userStats.medals.totalSilver}
                  bronze={userStats.medals.totalBronze}
                />
              )}

              {/* Recent Medals */}
              {userStats.medals?.recent && userStats.medals.recent.length > 0 && (
                <View className="mt-2 border-t border-gray-100 pt-2">
                  <Text className="mb-1 text-xs text-gray-600">Recent:</Text>
                  {userStats.medals.recent.slice(0, 3).map((medal) => (
                    <View
                      key={medal.id}
                      className="flex-row items-center justify-between py-0.5"
                    >
                      <Text className="text-xs text-gray-700">
                        {medal.levelName} ({medal.year}/{medal.month})
                      </Text>
                      <Text className="text-xs font-medium capitalize text-gray-900">
                        {medal.medalType.toLowerCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </DialogContent>
    </Dialog>
  );
}
