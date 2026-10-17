/**
 * app/(tabs)/account.tsx
 * Public home screen that shows the app's data flow end to end.
 *
 * - The account card reads the auth status (client state, auth store) and
 *   offers "Sign in" for guests or "Open dashboard" when signed in.
 * - The items list reads server state through useItems() (TanStack Query):
 *   cached, paginated and refreshable. It only mounts while signed in,
 *   because the endpoint requires a token.
 *
 * Use it as a reference for combining both kinds of state on one screen.
 */
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { useItems } from "@/hooks/resources/dev/Items.r";
import { useAuthStore } from "@/stores/dev/auth.store";
import { useTheme } from "@/theme";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { verticalScale } from "react-native-size-matters";

/** Paginated list of items; loads the next page when scrolled to the end. */
function ItemsList() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    items,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useItems();

  if (isLoading) return <ActivityIndicator color={theme.primary} />;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      refreshing={isRefetching}
      onRefresh={refetch}
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      contentContainerStyle={{
        gap: spacing.sm,
        paddingBottom: insets.bottom + verticalScale(100),
      }}
      ListEmptyComponent={
        <Text size="sm" dim>
          No items yet.
        </Text>
      }
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator color={theme.primary} /> : null
      }
      renderItem={({ item }) => (
        <SectionCard borderColor={theme.border}>
          <Text medium>{item.title}</Text>
          {item.description && (
            <Text size="sm" dim>
              {item.description}
            </Text>
          )}
        </SectionCard>
      )}
    />
  );
}

export default function AccountScreen() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.status === "authed");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingHorizontal: spacing.md,
        paddingTop: insets.top + spacing.md,
        gap: spacing.md,
      }}
    >
      <SectionCard borderColor={theme.border}>
        <Text size="lg" medium>
          Account
        </Text>
        <Text size="sm" dim style={{ marginBottom: spacing.sm }}>
          {isAuthenticated
            ? "You're signed in."
            : "You're browsing as a guest."}
        </Text>
        {isAuthenticated ? (
          <Button
            title="Open dashboard"
            onPress={() => router.push("/(dashboard)/user")}
          />
        ) : (
          <Button
            title="Sign in"
            onPress={() => router.push("/(auth)/login")}
          />
        )}
      </SectionCard>

      <Text size="lg" medium>
        Items
      </Text>

      {isAuthenticated ? (
        <ItemsList />
      ) : (
        <Text size="sm" dim>
          Sign in to load items from the API.
        </Text>
      )}
    </View>
  );
}
