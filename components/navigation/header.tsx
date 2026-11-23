/**
 * components/navigation/header.tsx
 * The app header: a back button (when there is somewhere to go back to), the
 * screen title, and on the right the account entry point: an avatar that
 * opens the dashboard when signed in, a "Sign in" button for guests.
 *
 * Use it as the `header` option of any navigator, passing only a title:
 *   <Tabs screenOptions={{ header: ({ options, route }) => (
 *     <AppHeader title={options.title ?? route.name} back={false} />
 *   ) }} />
 *
 * It applies the top safe-area inset itself, so screens beneath it should not
 * add `insets.top`.
 *
 *   back   true or false to force the back button; omitted, it shows when the
 *          router has history to go back to.
 */
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { useMe } from "@/hooks/resources/dev/User.r";
import { useAuthStore } from "@/stores/dev/auth.store";
import { useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const HEADER_HEIGHT = 52;

type AppHeaderProps = {
  title?: string;
  back?: boolean;
};

export function AppHeader({ title, back }: AppHeaderProps) {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.status === "authed");
  const { data: me } = useMe();
  const showBack = back ?? router.canGoBack();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <View
        style={{
          height: HEADER_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        }}
      >
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
        )}

        <Text size="lg" medium numberOfLines={1} style={{ flex: 1 }}>
          {title}
        </Text>

        {isAuthenticated ? (
          <Pressable
            onPress={() => router.push("/(dashboard)/dev")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open dashboard"
          >
            <Avatar name={me?.name} size={32} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            hitSlop={8}
            accessibilityRole="button"
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text size="sm" medium>
              Sign in
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
