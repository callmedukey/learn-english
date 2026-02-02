import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { View } from "react-native";

import { usePushNotifications } from "@/hooks/usePushNotifications";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  // Initialize push notifications (must be inside navigation context)
  usePushNotifications();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#5D3A29",
        tabBarInactiveTintColor: "#737373",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E5E5",
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: "#F9F5F0",
        },
        headerTitleStyle: {
          color: "#4A5568",
          fontWeight: "600",
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerTitle: "Dashboard",
        }}
      />
      <Tabs.Screen
        name="novel"
        options={{
          title: "Novel",
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          headerTitle: "Novel",
        }}
      />
      <Tabs.Screen
        name="rc"
        options={{
          title: "RC",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="file-text-o" color={color} />
          ),
          headerTitle: "Reading Comprehension",
        }}
      />
      <Tabs.Screen
        name="bpa"
        options={{
          title: "VIP",
          tabBarIcon: ({ color }) => (
            <View>
              <TabBarIcon name="star" color={color} />
            </View>
          ),
          headerTitle: "VIP Members Only",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerTitle: "Profile",
        }}
      />
    </Tabs>
  );
}
