import { Ionicons } from "@expo/vector-icons";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
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
          설정 정보를 불러오는데 실패했습니다
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
          계정 정보
        </Text>
        <Text className="text-xs text-muted-foreground">
          • 닉네임은 리더보드와 프로필에 표시됩니다{"\n"}
          • 생년월일은 학년 계산에 사용됩니다{"\n"}
          • 이메일은 로그인에 사용되며 변경할 수 없습니다
        </Text>
      </View>

      {/* Delete Account */}
      <View className="mt-6 items-center">
        <Text className="text-xs text-muted-foreground">
          계정 삭제는 웹사이트에서 가능합니다
        </Text>
      </View>
    </ScrollView>
  );
}
