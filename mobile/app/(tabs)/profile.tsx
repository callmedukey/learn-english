import FontAwesome from "@expo/vector-icons/FontAwesome";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView className="flex-1 px-4 py-6">
        {/* User Info */}
        <View className="mb-6 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
            <FontAwesome name="user" size={40} color="#F9F5F0" />
          </View>
          <Text className="text-xl font-semibold text-foreground">
            {user?.nickname || user?.name || "User"}
          </Text>
          <Text className="text-muted-foreground">{user?.email}</Text>
          {user?.hasPaidSubscription && (
            <View className="mt-2 flex-row items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
              <FontAwesome name="star" size={12} color="#5D3A29" />
              <Text className="text-sm font-medium text-primary">VIP Member</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View className="gap-2">
          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-white p-4">
            <View className="flex-row items-center gap-3">
              <FontAwesome name="cog" size={20} color="#737373" />
              <Text className="text-base text-foreground">Settings</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#737373" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-white p-4">
            <View className="flex-row items-center gap-3">
              <FontAwesome name="credit-card" size={20} color="#737373" />
              <Text className="text-base text-foreground">Subscription</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#737373" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-white p-4">
            <View className="flex-row items-center gap-3">
              <FontAwesome name="question-circle" size={20} color="#737373" />
              <Text className="text-base text-foreground">Help & Support</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#737373" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="mt-8 rounded-xl bg-destructive/10 p-4"
          onPress={signOut}
          activeOpacity={0.7}
        >
          <Text className="text-center font-semibold text-destructive">
            Log Out
          </Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text className="mt-8 text-center text-sm text-muted-foreground">
          Reading Camp v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
