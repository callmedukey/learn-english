import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BPALayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#5D3A29",
          ...(Platform.OS === "android" && {
            height: 56 + insets.top,
            paddingTop: insets.top,
          }),
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          color: "#FFFFFF",
          fontWeight: "600",
        },
        headerShadowVisible: false,
        headerBackTitle: "Back",
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="[levelId]/index"
        options={{
          title: "Novels",
        }}
      />
      <Stack.Screen
        name="[levelId]/[novelId]/index"
        options={{
          title: "Chapters",
        }}
      />
      <Stack.Screen
        name="[levelId]/[novelId]/[chapterId]/index"
        options={{
          title: "Quiz",
          headerLeft: () => null,
        }}
      />
    </Stack>
  );
}
