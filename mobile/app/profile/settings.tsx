import { Ionicons } from "@expo/vector-icons";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { SettingsForm } from "@/components/profile";
import { apiClient } from "@/services/api/client";

interface UserSettings {
  nickname: string;
  email: string;
  gender: string | null;
  birthday: string | null;
  hasCredentials: boolean;
}

async function fetchUserSettings(): Promise<UserSettings> {
  const response = await apiClient.get<UserSettings>("/api/mobile/user/settings");
  return response.data;
}

export default function SettingsScreen() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ["userSettings"],
    queryFn: fetchUserSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleUpdate = () => {
    // Refresh user settings and auth context
    queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // Also refresh dashboard
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#5D3A29" />
      </View>
    );
  }

  if (isError || !settings) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-4">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="mt-3 text-center text-foreground">
          Failed to load settings
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <SettingsForm initialSettings={settings} onUpdate={handleUpdate} />

      {/* Account Info */}
      <View className="mt-8 rounded-xl bg-muted p-4">
        <Text className="mb-2 text-sm font-medium text-foreground">
          Account Information
        </Text>
        <Text className="text-xs text-muted-foreground">
          • Nickname is displayed on leaderboard and profile{"\n"}
          • Birthday is used for grade calculation{"\n"}
          • Email is used for login and cannot be changed
        </Text>
      </View>

      {/* Delete Account */}
      <View className="mt-6 items-center">
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Delete Account / 계정 삭제",
              "You will be redirected to the website to delete your account. Continue?\n\n계정 삭제를 위해 웹사이트로 이동합니다. 계속하시겠습니까?",
              [
                { text: "Cancel / 취소", style: "cancel" },
                {
                  text: "Continue / 계속",
                  style: "destructive",
                  onPress: () => Linking.openURL("https://readingcamp.kr/profile/settings/delete-account"),
                },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Text className="text-sm text-red-500 underline">
            Delete Account / 계정 삭제
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
