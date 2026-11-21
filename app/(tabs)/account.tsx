/**
 * app/(tabs)/account.tsx
 * Interim screen: account card plus the items list. It is replaced by the
 * Data screen in the example-app redesign.
 */
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/tabbar";
import { useItems } from "@/hooks/resources/dev/Items.r";
import { useAuthStore } from "@/stores/dev/auth.store";
import { useTheme } from "@/theme";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
        paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
      }}
      ListEmptyComponent={
        <Text size="sm" dim>
          No items yet.
        </Text>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator color={theme.primary} />
        ) : undefined
      }
      renderItem={({ item }) => (
        <Card>
          <Text medium>{item.title}</Text>
          {item.description && (
            <Text size="sm" dim>
              {item.description}
            </Text>
          )}
        </Card>
      )}
    />
  );
}

export default function AccountScreen() {
  const { theme, spacing } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.status === "authed");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        padding: spacing.md,
        gap: spacing.md,
      }}
    >
      <Card>
        <Text size="lg" bold>
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
      </Card>

      <Text size="lg" bold>
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
