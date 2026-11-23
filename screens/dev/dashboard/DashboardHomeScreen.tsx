/**
 * screens/dev/dashboard/DashboardHomeScreen.tsx
 * Home of the demo dashboard: the signed-in user, links to the two demo
 * screens and sign out. Example-only: safe to delete with the rest of
 * screens/dev and app/(dashboard)/dev.
 *
 * Every card names the file it is built from.
 */
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useLogout } from "@/hooks/resources/dev/Auth.r";
import { useMe } from "@/hooks/resources/dev/User.r";
import { useTheme } from "@/theme";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardHomeScreen() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: me, isLoading } = useMe();
  const { mutate: logout, isPending } = useLogout();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        padding: spacing.md,
        paddingBottom: insets.bottom + spacing.md,
        gap: spacing.md,
      }}
    >
      <Card style={{ gap: spacing.sm }}>
        {isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <Avatar name={me?.name} size="lg" />
            <View style={{ flex: 1 }}>
              <Text medium>{me?.name}</Text>
              <Text size="sm" dim>
                {me?.email}
              </Text>
            </View>
          </View>
        )}
        <Text size="xs" dim>
          Server state from useMe(): hooks/resources/dev/User.r.ts
        </Text>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text size="lg" semibold>
          Items
        </Text>
        <Text size="sm" dim>
          An infinite list, create in a modal, delete with a confirmation.
        </Text>
        <Button
          title="Open items"
          rightIcon="arrow-forward"
          onPress={() => router.push("/(dashboard)/dev/items")}
        />
        <Text size="xs" dim>
          screens/dev/dashboard/DashboardItemsScreen.tsx, hooks/resources/dev/Items.r.ts
        </Text>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text size="lg" semibold>
          Profile
        </Text>
        <Text size="sm" dim>
          A form with inline validation errors.
        </Text>
        <Button
          title="Open profile"
          rightIcon="arrow-forward"
          onPress={() => router.push("/(dashboard)/dev/profile")}
        />
        <Text size="xs" dim>
          screens/dev/dashboard/DashboardProfileScreen.tsx, hooks/resources/dev/User.r.ts
        </Text>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text size="lg" semibold>
          Session
        </Text>
        <Text size="sm" dim>
          Signing out clears the session. The dashboard guard then returns you
          to the login screen.
        </Text>
        <Button
          title="Sign out"
          variant="outline"
          loading={isPending}
          onPress={() => logout()}
        />
        <Text size="xs" dim>
          useLogout(): hooks/resources/dev/Auth.r.ts
        </Text>
      </Card>

      <Text size="xs" dim>
        The mock backend stores nothing, so created, edited or deleted data is
        not kept. Watch the requests in the Prism terminal.
      </Text>
    </ScrollView>
  );
}
