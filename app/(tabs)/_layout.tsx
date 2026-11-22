/**
 * app/(tabs)/_layout.tsx
 * The public tab shell: screens available without signing in.
 *
 * Renders the custom AppTabBar and AppHeader. To add a tab, create a screen
 * file in this folder and register it below with a title and icon: the tab
 * bar and the menu panel pick it up automatically.
 */
import { AppHeader } from "@/components/navigation/header";
import { AppTabBar } from "@/components/navigation/tabbar";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        header: ({ options, route }) => (
          <AppHeader title={options.title ?? route.name} back={false} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "App",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="home-outline"
              size={22}
              color={typeof color === "string" ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: "Data",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="server-outline"
              size={22}
              color={typeof color === "string" ? color : undefined}
            />
          ),
        }}
      />
    </Tabs>
  );
}
