import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { UserStatsModal } from "@/components/dashboard/UserStatsModal";
import { useBPARankings } from "@/hooks/useBPA";
import type { BPARanking } from "@/types/bpa";

interface BPALevelOption {
  id: string;
  name: string;
}

interface BPASemesterLeaderboardProps {
  season: "Spring" | "Summer" | "Fall" | "Winter";
  timeframeId: string | null;
  defaultLevelId?: string;
  bpaLevels: BPALevelOption[];
  expanded?: boolean;
}

export function BPASemesterLeaderboard({
  season,
  timeframeId,
  defaultLevelId,
  bpaLevels,
  expanded = false,
}: BPASemesterLeaderboardProps) {
  // Find the initial level index
  const initialLevelIndex = defaultLevelId
    ? bpaLevels.findIndex((level) => level.id === defaultLevelId)
    : 0;
  const validInitialIndex = initialLevelIndex >= 0 ? initialLevelIndex : 0;

  const [currentLevelIndex, setCurrentLevelIndex] = useState(validInitialIndex);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const currentLevel = bpaLevels[currentLevelIndex];

  // Reset to defaultLevelId when timeframeId or defaultLevelId changes
  useEffect(() => {
    if (defaultLevelId) {
      const newIndex = bpaLevels.findIndex(
        (level) => level.id === defaultLevelId
      );
      if (newIndex >= 0) {
        setCurrentLevelIndex(newIndex);
      }
    }
  }, [defaultLevelId, timeframeId, bpaLevels]);

  const handlePrevLevel = () => {
    if (currentLevelIndex > 0) {
      setCurrentLevelIndex(currentLevelIndex - 1);
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < bpaLevels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
    }
  };

  const handleUserPress = (userId: string) => {
    setSelectedUserId(userId);
    setModalOpen(true);
  };

  return (
    <>
    <View className="overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Header */}
      <View className="bg-primary px-4 py-3">
        <Text className="text-center text-lg font-semibold text-primary-foreground">
          {season} Semester
        </Text>
      </View>

      {/* Level Navigation */}
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-gray-100 px-2 py-2">
        <TouchableOpacity
          onPress={handlePrevLevel}
          disabled={currentLevelIndex === 0}
          className={`p-2 ${currentLevelIndex === 0 ? "opacity-30" : ""}`}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentLevelIndex === 0 ? "#9CA3AF" : "#374151"}
          />
        </TouchableOpacity>

        <Text className="font-semibold text-gray-900">
          {currentLevel?.name || ""}
        </Text>

        <TouchableOpacity
          onPress={handleNextLevel}
          disabled={currentLevelIndex === bpaLevels.length - 1}
          className={`p-2 ${currentLevelIndex === bpaLevels.length - 1 ? "opacity-30" : ""}`}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              currentLevelIndex === bpaLevels.length - 1 ? "#9CA3AF" : "#374151"
            }
          />
        </TouchableOpacity>
      </View>

      {/* Rankings */}
      <RankingDisplay
        timeframeId={timeframeId}
        season={season}
        levelId={currentLevel?.id || null}
        expanded={expanded}
        onUserPress={handleUserPress}
      />
    </View>

    {/* User Stats Modal */}
    <UserStatsModal
      userId={selectedUserId}
      open={modalOpen}
      onOpenChange={setModalOpen}
    />
    </>
  );
}

interface RankingDisplayProps {
  timeframeId: string | null;
  season: "Spring" | "Summer" | "Fall" | "Winter";
  levelId: string | null;
  expanded: boolean;
  onUserPress: (userId: string) => void;
}

function RankingDisplay({
  timeframeId,
  season,
  levelId,
  expanded,
  onUserPress,
}: RankingDisplayProps) {
  const { data, isLoading, isError } = useBPARankings(
    timeframeId,
    season,
    levelId
  );
  const rankings = data?.rankings || [];

  const containerHeight = expanded ? 320 : 200;

  // No timeframe selected
  if (!timeframeId) {
    return (
      <View
        style={{ height: containerHeight }}
        className="items-center justify-center px-4"
      >
        <Text className="text-center text-sm text-gray-500">
          Please select a timeframe to view rankings
        </Text>
      </View>
    );
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <View
        style={{ height: containerHeight }}
        className="items-center justify-center"
      >
        <ActivityIndicator size="small" color="#5D3A29" />
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View
        style={{ height: containerHeight }}
        className="items-center justify-center px-4"
      >
        <Text className="text-center text-sm text-destructive">
          Failed to load rankings
        </Text>
      </View>
    );
  }

  // Empty state
  if (rankings.length === 0) {
    return (
      <View
        style={{ height: containerHeight }}
        className="items-center justify-center px-4"
      >
        <Text className="text-center text-sm text-gray-500">
          No rankings available
        </Text>
      </View>
    );
  }

  return (
    <View style={{ height: containerHeight }}>
      {/* Header Row */}
      <View className="flex-row items-center border-b border-gray-100 px-3 py-2">
        <View className="w-8">
          <Text className="text-xs font-semibold text-gray-500">#</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold text-gray-500">NICKNAME</Text>
        </View>
        <View className="w-14">
          <Text className="text-center text-xs font-semibold text-gray-500">
            GRADE
          </Text>
        </View>
        <View className="w-16">
          <Text className="text-right text-xs font-semibold text-gray-500">
            POINT
          </Text>
        </View>
      </View>

      {/* Rankings List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {rankings.map((item) => (
          <RankingRow key={item.id} ranking={item} onPress={() => onUserPress(item.id)} />
        ))}

        {/* Fill empty slots if less than 5 */}
        {rankings.length < 5 &&
          Array.from({ length: 5 - rankings.length }, (_, i) => (
            <View
              key={`empty-${i}`}
              className="flex-row items-center px-3 py-2 opacity-30"
            >
              <View className="w-8">
                <Text className="font-bold text-gray-400">
                  {rankings.length + i + 1}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-400">-</Text>
              </View>
              <View className="mx-2 rounded bg-muted px-1.5 py-0.5">
                <Text className="text-xs text-gray-400">-</Text>
              </View>
              <View className="w-16">
                <Text className="text-right text-gray-400">-</Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

interface RankingRowProps {
  ranking: BPARanking;
  onPress: () => void;
}

function RankingRow({ ranking, onPress }: RankingRowProps) {
  const getCrownColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#FBBF24"; // Gold
      case 2:
        return "#9CA3AF"; // Silver
      case 3:
        return "#B45309"; // Bronze
      default:
        return null;
    }
  };

  const crownColor = getCrownColor(ranking.rank);

  return (
    <TouchableOpacity
      className="flex-row items-center px-3 py-2 active:bg-gray-50"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Rank */}
      <View className="w-8">
        <Text className="font-bold text-gray-600">{ranking.rank}</Text>
      </View>

      {/* Nickname + Crown + Campus */}
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text
            className={`font-medium ${ranking.campusId ? "text-primary" : "text-gray-900"}`}
            numberOfLines={1}
          >
            {ranking.nickname}
          </Text>
          {crownColor && (
            <Ionicons name="trophy" size={14} color={crownColor} />
          )}
        </View>
        {ranking.campusName && (
          <Text className="text-xs text-primary" numberOfLines={1}>
            {ranking.campusName}
          </Text>
        )}
      </View>

      {/* Grade Badge */}
      <View className="mx-2 rounded bg-muted px-1.5 py-0.5">
        <Text className="text-xs text-muted-foreground">
          {ranking.grade?.replace(/^Grade\s*/i, "") || "-"}
        </Text>
      </View>

      {/* Score */}
      <View className="w-16">
        <Text className="text-right font-bold text-amber-700">
          {ranking.score.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
