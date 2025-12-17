import { Stack } from "expo-router";

export default function NovelLayout() {
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
        name="[arId]/index"
        options={{
          title: "Novels",
        }}
      />
      <Stack.Screen
        name="[arId]/[novelId]/index"
        options={{
          title: "Novel",
        }}
      />
      <Stack.Screen
        name="[arId]/[novelId]/[chapterId]/index"
        options={{
          title: "Quiz",
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
