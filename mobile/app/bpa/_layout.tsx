import { Stack } from "expo-router";

export default function BPALayout() {
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
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
