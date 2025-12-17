import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import type { RankingUser, RankingsByType } from "@/services/api/dashboard";

import { UserStatsModal } from "./UserStatsModal";

interface LeaderboardCardProps {
  title: string;
  icon: string;
  iconColor: string;
  overallRankings: RankingsByType;
  gradeRankings: RankingsByType;
  currentUserId?: string;
}

type ScoreType = "total" | "novel" | "rc";
type ViewType = "overall" | "grade";

function getMedalIcon(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function RankingRow({
  user,
  isCurrentUser,
  onPress,
}: {
  user: RankingUser;
  isCurrentUser: boolean;
  onPress: () => void;
}) {
  const medal = getMedalIcon(user.rank);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center py-2 ${
        isCurrentUser ? "rounded-lg bg-primary/5" : ""
      }`}
    >
      {/* Rank */}
      <View className="w-8 items-center">
        {medal ? (
          <Text className="text-base">{medal}</Text>
        ) : (
          <Text className="text-sm text-muted-foreground">{user.rank}</Text>
        )}
      </View>

      {/* Country Icon */}
      <View className="mx-2 h-5 w-5 items-center justify-center">
        {user.countryIcon ? (
          <Image
            source={{ uri: user.countryIcon }}
            className="h-5 w-5"
            resizeMode="contain"
          />
        ) : (
          <View className="h-5 w-5 rounded-full bg-muted" />
        )}
      </View>

      {/* Nickname & Grade */}
      <View className="flex-1">
        <Text
          className={`text-sm ${
            isCurrentUser ? "font-semibold text-primary" : "text-foreground"
          }`}
          numberOfLines={1}
        >
          {user.nickname}
        </Text>
        {user.campusName && (
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {user.campusName}
          </Text>
        )}
      </View>

      {/* Grade Badge */}
      <View className="mx-2 rounded bg-muted px-1.5 py-0.5">
        <Text className="text-xs text-muted-foreground">{user.grade}</Text>
      </View>

      {/* Score */}
      <Text
        className={`w-20 text-right text-sm ${
          isCurrentUser ? "font-semibold text-primary" : "text-foreground"
        }`}
      >
        {user.score.toLocaleString()} pts
      </Text>
    </TouchableOpacity>
  );
}

export function LeaderboardCard({
  title,
  icon,
  iconColor,
  overallRankings,
  gradeRankings,
  currentUserId,
}: LeaderboardCardProps) {
  const [scoreType, setScoreType] = useState<ScoreType>("total");
  const [viewType, setViewType] = useState<ViewType>("overall");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const rankings = viewType === "overall" ? overallRankings : gradeRankings;
  const currentRankings = rankings[scoreType];

  const handleUserPress = (userId: string) => {
    setSelectedUserId(userId);
    setModalOpen(true);
  };

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Header */}
      <View className="mb-3 flex-row items-center gap-2">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <FontAwesome name={icon as any} size={14} color={iconColor} />
        </View>
        <Text className="text-base font-semibold text-foreground">{title}</Text>
      </View>

      {/* Score Type Tabs */}
      <View className="mb-3">
        <Tabs value={scoreType} onValueChange={(val) => setScoreType(val as ScoreType)}>
          <TabsList variant="pills">
            <TabsTrigger value="total" variant="pills">TOTAL</TabsTrigger>
            <TabsTrigger value="novel" variant="pills">NOVEL</TabsTrigger>
            <TabsTrigger value="rc" variant="pills">R.C</TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      {/* Rankings List */}
      <View className="mb-3">
        {currentRankings.length > 0 ? (
          currentRankings.map((user) => (
            <RankingRow
              key={user.id}
              user={user}
              isCurrentUser={user.id === currentUserId}
              onPress={() => handleUserPress(user.id)}
            />
          ))
        ) : (
          <View className="py-6">
            <Text className="text-center text-muted-foreground">
              No rankings available
            </Text>
          </View>
        )}
      </View>

      {/* View Type Tabs */}
      <Tabs value={viewType} onValueChange={(val) => setViewType(val as ViewType)}>
        <TabsList>
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="grade">My Grade</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* User Stats Modal */}
      <UserStatsModal
        userId={selectedUserId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </View>
  );
}
