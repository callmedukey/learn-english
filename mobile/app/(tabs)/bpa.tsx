import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BPACampusCalendar,
  BPALevelCard,
  BPALevelsSkeleton,
  BPASemesterLeaderboard,
  BPASemesterSelector,
  BPAViewModeToggle,
  type BPAViewMode,
} from "@/components/bpa";
import {
  useBPALevels,
  useBPATimeframes,
  useCampusEvents,
  useCurrentSemester,
} from "@/hooks/useBPA";

export default function BPAScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframeId, setSelectedTimeframeId] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<BPAViewMode>("single");

  const { data: levelsData, isLoading: levelsLoading, error: levelsError, refetch: refetchLevels } = useBPALevels();
  const { data: timeframesData, isLoading: timeframesLoading, refetch: refetchTimeframes } = useBPATimeframes();
  const { data: campusEventsData, isLoading: campusEventsLoading, refetch: refetchCampusEvents } = useCampusEvents();

  const timeframes = timeframesData?.timeframes || [];
  const currentSemester = useCurrentSemester(timeframes, selectedTimeframeId);

  // Auto-select the active timeframe when data loads
  useEffect(() => {
    if (timeframes.length > 0 && !selectedTimeframeId) {
      const activeTimeframe = timeframes.find((tf) => tf.isActive);
      if (activeTimeframe) {
        setSelectedTimeframeId(activeTimeframe.id);
      } else {
        // Fallback to the first (most recent) timeframe
        setSelectedTimeframeId(timeframes[0].id);
      }
    }
  }, [timeframes, selectedTimeframeId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchLevels(), refetchTimeframes(), refetchCampusEvents()]);
    setRefreshing(false);
  }, [refetchLevels, refetchTimeframes, refetchCampusEvents]);

  // Format season from UPPERCASE to Title case
  const formatSeasonName = (
    season: string
  ): "Spring" | "Summer" | "Fall" | "Winter" => {
    const formatted = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
    return formatted as "Spring" | "Summer" | "Fall" | "Winter";
  };

  // Loading state
  if ((levelsLoading || timeframesLoading) && !refreshing && !levelsData) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <BPALevelsSkeleton />
      </SafeAreaView>
    );
  }

  // Error state
  if (levelsError) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="mb-2 text-lg font-semibold text-destructive">
            Unable to load
          </Text>
          <Text className="text-center text-muted-foreground">
            {levelsError.message || "Please try again later"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check campus access
  const hasCampusAccess = levelsData?.hasCampusAccess ?? false;
  const bpaLevels = levelsData?.bpaLevels || [];

  // No campus access
  if (!hasCampusAccess) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center gap-4">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <FontAwesome name="building-o" size={36} color="#D97706" />
            </View>
            <Text className="text-xl font-semibold text-foreground">
              Campus Access Required
            </Text>
            <Text className="text-center text-muted-foreground">
              BPA content is only available to campus members. Please contact
              your campus administrator to gain access.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Prepare level options for leaderboards
  const levelOptions = bpaLevels.map((level) => ({
    id: level.id,
    name: level.name,
  }));

  // Get default level (first assigned level or first level)
  const defaultLevelId =
    bpaLevels.find((l) => l.isAssigned)?.id || bpaLevels[0]?.id;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6 flex-row items-center gap-2">
          <Text className="text-2xl font-bold text-amber-900">
            BPA CHALLENGE
          </Text>
          <Ionicons name="trophy" size={24} color="#5D3A29" />
        </View>

        {/* View Mode Toggle & Timeframe Selector */}
        <View className="mb-4 gap-3">
          <BPAViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <BPASemesterSelector
            timeframes={timeframes}
            selectedTimeframeId={selectedTimeframeId}
            onSelect={setSelectedTimeframeId}
          />
        </View>

        {/* Leaderboards */}
        <View className="mb-8">
          {viewMode === "single" && currentSemester ? (
            // Single expanded leaderboard for current semester
            <BPASemesterLeaderboard
              season={formatSeasonName(currentSemester.season)}
              timeframeId={selectedTimeframeId}
              defaultLevelId={defaultLevelId}
              bpaLevels={levelOptions}
              expanded
            />
          ) : (
            // Single column list of all semesters
            <View className="gap-4">
              <BPASemesterLeaderboard
                season="Spring"
                timeframeId={selectedTimeframeId}
                defaultLevelId={defaultLevelId}
                bpaLevels={levelOptions}
              />
              <BPASemesterLeaderboard
                season="Summer"
                timeframeId={selectedTimeframeId}
                defaultLevelId={defaultLevelId}
                bpaLevels={levelOptions}
              />
              <BPASemesterLeaderboard
                season="Fall"
                timeframeId={selectedTimeframeId}
                defaultLevelId={defaultLevelId}
                bpaLevels={levelOptions}
              />
              <BPASemesterLeaderboard
                season="Winter"
                timeframeId={selectedTimeframeId}
                defaultLevelId={defaultLevelId}
                bpaLevels={levelOptions}
              />
            </View>
          )}
        </View>

        {/* Level Selection Section */}
        <View className="mb-4">
          <Text className="text-xl font-bold text-amber-900">
            Choose your BPA LEVEL
          </Text>
        </View>

        {/* Level Cards */}
        <View className="gap-4">
          {bpaLevels.map((level) => (
            <BPALevelCard key={level.id} level={level} />
          ))}
        </View>

        {/* Empty state for levels */}
        {bpaLevels.length === 0 && (
          <View className="items-center py-8">
            <Text className="text-lg font-medium text-foreground">
              No levels available
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">
              There are currently no BPA levels. Please check back later.
            </Text>
          </View>
        )}

        {/* Campus Calendar Section */}
        <View className="mb-8 mt-4">
          <BPACampusCalendar
            events={campusEventsData?.events || []}
            isLoading={campusEventsLoading && !campusEventsData}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
