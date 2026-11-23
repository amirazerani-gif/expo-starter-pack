/**
 * components/navigation/tabbar.tsx
 * The custom tab bar for the public tab shell (app/(tabs)/_layout.tsx).
 *
 * A floating bar with one button per tab screen, plus a "Menu" button that
 * expands a panel above the bar holding <DrawerContent />.
 *
 *  - Tabs: every screen registered in the layout with a `tabBarIcon` option
 *    appears here, in layout order, with the title and icon from that screen's
 *    options. Adding a tab never means editing this file.
 *  - Menu: the panel lists the same screens; account actions live in
 *    drawer-content.tsx. Tapping the Menu button again closes it.
 *  - The bar floats over the screens. Give scrollable content bottom padding
 *    of `insets.bottom + TAB_BAR_CLEARANCE` so nothing hides behind it.
 *
 * Props are derived from expo-router's Tabs, so this file follows the router's
 * own types. Navigation goes through `navigateToTab(route.key)`: it takes the
 * route KEY, not the route name.
 */
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { DrawerContent, type DrawerLink } from "./drawerContent";

export type AppTabBarProps =
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]> extends (
    props: infer P,
  ) => any
    ? P
    : never;

const BAR_HEIGHT = 60;
/** Height of the open menu panel. Raise it if you add more rows. */
const DRAWER_HEIGHT = 340;
const MARGIN = 12;
/** Bottom space a screen should reserve (in addition to the safe-area inset). */
export const TAB_BAR_CLEARANCE = BAR_HEIGHT + MARGIN + 16;

export function AppTabBar({
  state,
  descriptors,
  navigateToTab,
  insets,
}: AppTabBarProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  // The panel stays mounted only while open or animating, so its hooks idle otherwise.
  const [mounted, setMounted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const setMenu = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) setMounted(true);
      Animated.timing(progress, {
        toValue: next ? 1 : 0,
        duration: 220,
        useNativeDriver: false, // animating height
      }).start(({ finished }) => {
        if (finished && !next) setMounted(false);
      });
    },
    [progress],
  );

  // Only screens that declare a tabBarIcon get a tab.
  const items = state.routes.flatMap((route, index) => {
    const options = descriptors[route.key]?.options;
    if (!options?.tabBarIcon) return [];
    return [{ route, options, focused: state.index === index }];
  });

  const goToTab = (routeKey: string) => {
    if (open) setMenu(false);
    navigateToTab(routeKey);
  };

  const links: DrawerLink[] = items.map(({ route, options, focused }) => ({
    key: route.key,
    title: options.title ?? route.name,
    active: focused,
    icon: (color) => options.tabBarIcon?.({ focused, color, size: 20 }),
    onPress: () => goToTab(route.key),
  }));

  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [BAR_HEIGHT, BAR_HEIGHT + DRAWER_HEIGHT],
  });

  return (
    <View
      style={[
        styles.root,
        { left: MARGIN, right: MARGIN, bottom: insets.bottom + MARGIN },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            height,
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
        ]}
      >
        {mounted && (
          <Animated.View style={{ height: DRAWER_HEIGHT, opacity: progress }}>
            <DrawerContent links={links} onClose={() => setMenu(false)} />
          </Animated.View>
        )}

        <View style={[styles.bar, { borderTopColor: theme.border }]}>
          {items.map(({ route, options, focused }) => (
            <TabButton
              key={route.key}
              label={options.title ?? route.name}
              focused={focused}
              onPress={() => goToTab(route.key)}
              icon={(color) =>
                options.tabBarIcon?.({ focused, color, size: 22 })
              }
            />
          ))}
          <TabButton
            label="Menu"
            focused={open}
            onPress={() => setMenu(!open)}
            icon={(color) => (
              <Ionicons
                name={open ? "close-outline" : "menu-outline"}
                size={22}
                color={color}
              />
            )}
          />
        </View>
      </Animated.View>
    </View>
  );
}

type TabButtonProps = {
  label: string;
  focused: boolean;
  onPress: () => void;
  /** Receives the tab's color: active or inactive. */
  icon: (color: string) => React.ReactNode;
};

function TabButton({ label, focused, onPress, icon }: TabButtonProps) {
  const { theme } = useTheme();
  const color = focused ? theme.primary : theme.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
    >
      {icon(color)}
      <Text size="xs" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    zIndex: 100,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 10,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
});
