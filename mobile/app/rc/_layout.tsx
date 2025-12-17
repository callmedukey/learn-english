import { Stack } from "expo-router";

export default function RCLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F9F5F0",
        },
        headerTintColor: "#4A5568",
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="[rcLevelId]/index"
        options={{
          title: "Keywords",
        }}
      />
      <Stack.Screen
        name="[rcLevelId]/[keywordId]/index"
        options={{
          title: "Quiz",
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
