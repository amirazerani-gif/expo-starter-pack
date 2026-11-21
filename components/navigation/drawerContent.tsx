/**
 * components/navigation/drawerContent.tsx
 * The panel that opens above the tab bar. Two sections:
 *
 *   Links     one row per entry in `links`. The tab bar passes its own
 *             screens; pass more entries to add rows.
 *   Account   avatar, name, dashboard and sign-out when signed in; a sign-in
 *             button for guests.
 *
 * It only navigates and renders. Sizing and animation belong to the tab bar
 * (DRAWER_HEIGHT in tabbar.tsx); content that overflows scrolls.
 *
 * It reads the dev resource hooks and auth store: when you connect a real
 * backend, point these imports at your prod counterparts.
 */
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useLogout } from "@/hooks/resources/dev/Auth.r";
import { useMe } from "@/hooks/resources/dev/User.r";
import { useAuthStore } from "@/stores/dev/auth.store";
import { useTheme } from "@/theme";
import { router, type Href } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

export type DrawerLink = {
  key: string;
  title: string;
  active?: boolean;
  /** Receives the row's color so the icon follows the active state. */
  icon?: (color: string) => React.ReactNode;
  onPress: () => void;
};

type DrawerContentProps = {
  links: DrawerLink[];
  /** Closes the panel. Called before navigating away. */
  onClose: () => void;
};

export function DrawerContent({ links, onClose }: DrawerContentProps) {
  const { theme, spacing } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.status === "authed");
  const { data: me } = useMe();
  const { mutate: logout, isPending } = useLogout();

  const go = (href: Href) => {
    onClose();
    router.push(href);
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
    >
      <View>
        {links.map((link) => {
          const color = link.active ? theme.primary : theme.textPrimary;
          return (
            <Pressable
              key={link.key}
              onPress={link.onPress}
              accessibilityRole="button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingVertical: spacing.sm,
              }}
            >
              {link.icon?.(color)}
              <Text medium style={{ color }}>
                {link.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 1, backgroundColor: theme.border }} />

      {isAuthenticated ? (
        <View style={{ gap: spacing.sm }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <Avatar name={me?.name} />
            <View style={{ flex: 1 }}>
              <Text medium>{me?.name ?? "Signed in"}</Text>
              {me?.email ? (
                <Text size="sm" dim>
                  {me.email}
                </Text>
              ) : null}
            </View>
          </View>
          <Button
            title="Open dashboard"
            onPress={() => go("/(dashboard)/user")}
          />
          <Button
            title="Sign out"
            variant="outline"
            loading={isPending}
            onPress={() => logout()}
          />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Text size="sm" dim>
            You're browsing as a guest.
          </Text>
          <Button title="Sign in" onPress={() => go("/(auth)/login")} />
        </View>
      )}
    </ScrollView>
  );
}
