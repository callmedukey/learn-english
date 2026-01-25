import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function ProfileLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: "#5D3A29",
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-2">
            <Ionicons name="arrow-back" size={24} color="#5D3A29" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="subscription"
        options={{
          title: "Subscription",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Account Settings",
        }}
      />
      <Stack.Screen
        name="payments"
        options={{
          title: "Payment History",
        }}
      />
    </Stack>
  );
}
