import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ContinueLearning,
  LeaderboardCard,
  MyStatsCard,
  DashboardSkeleton,
  UserStatsModal,
} from "@/components/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useDashboard();
  const [myStatsModalOpen, setMyStatsModalOpen] = useState(false);

  const handleNovelPress = () => {
    if (data?.continueLearning.novel) {
      router.push(`/(tabs)/novel`);
    }
  };

  const handleRCPress = () => {
    if (data?.continueLearning.rc) {
      router.push(`/(tabs)/rc`);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <ScrollView className="flex-1">
          <View className="px-4 py-4">
            <View className="mb-4">
              <View className="h-7 w-48 animate-pulse rounded bg-muted" />
              <View className="mt-2 h-5 w-56 animate-pulse rounded bg-muted" />
            </View>
          </View>
          <DashboardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center p-4">
          <FontAwesome name="exclamation-circle" size={48} color="#EF4444" />
          <Text className="mt-4 text-center text-lg font-semibold text-foreground">
            Failed to load dashboard
          </Text>
          <Text className="mt-2 text-center text-muted-foreground">
            {error.message || "Please check your connection and try again"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#5D3A29"
          />
        }
      >
        {/* Welcome Section */}
        <View className="px-4 py-4">
          <Text className="text-2xl font-semibold text-foreground">
            Welcome back{data?.user.nickname ? `, ${data.user.nickname}` : ""}!
          </Text>
          <Text className="mt-1 text-muted-foreground">
            Continue your learning journey
          </Text>
        </View>

        <View className="gap-4 px-4">
          {/* 1. All-Time Leaderboard */}
          <View>
            <Text className="mb-3 text-lg font-semibold text-foreground">
              All-Time Rankings
            </Text>
            {data && (
              <LeaderboardCard
                title="All-Time Leaderboard"
                icon="trophy"
                iconColor="#F59E0B"
                overallRankings={data.leaderboards.allTime.overall}
                gradeRankings={data.leaderboards.allTime.grade}
                currentUserId={user?.id}
              />
            )}
          </View>

          {/* My All-Time Stats */}
          {data && (
            <MyStatsCard
              title="My All-Time Scores"
              stats={data.allTimeStats}
              showMedals
              onPress={() => setMyStatsModalOpen(true)}
            />
          )}

          {/* 2. Monthly Leaderboard */}
          <View>
            <Text className="mb-3 text-lg font-semibold text-foreground">
              This Month's Rankings
            </Text>
            {data && (
              <LeaderboardCard
                title="Monthly Leaderboard"
                icon="calendar"
                iconColor="#8B5CF6"
                overallRankings={data.leaderboards.monthly.overall}
                gradeRankings={data.leaderboards.monthly.grade}
                currentUserId={user?.id}
              />
            )}
          </View>

          {/* My Monthly Stats */}
          {data && (
            <MyStatsCard title="My Monthly Points" stats={data.monthlyStats} />
          )}

          {/* 3. Continue Learning Section */}
          <View>
            <Text className="mb-3 text-lg font-semibold text-foreground">
              Continue Learning
            </Text>
            <ContinueLearning
              novel={data?.continueLearning.novel ?? null}
              rc={data?.continueLearning.rc ?? null}
              onNovelPress={handleNovelPress}
              onRCPress={handleRCPress}
            />
          </View>
        </View>
      </ScrollView>

      {/* My Stats Modal */}
      <UserStatsModal
        userId={user?.id ?? null}
        open={myStatsModalOpen}
        onOpenChange={setMyStatsModalOpen}
      />
    </SafeAreaView>
  );
}
