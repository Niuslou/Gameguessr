// app/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "index") {
            iconName = focused ? "football" : "football-outline";
          } else if (route.name === "tipps") {
            iconName = focused ? "list" : "list-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Teams",
        }}
      />
      <Tabs.Screen
        name="tipps"
        options={{
          title: "Tippübersicht",
        }}
      />
    </Tabs>
  );
}
