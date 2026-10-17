/**
 * app/(dashboard)/user/index.tsx
 * Dashboard home. Shows the signed-in user from useMe() and a sign-out
 * button using useLogout(). Signing out clears the session, and the
 * dashboard guard then returns the user to the login screen.
 *
 * Use this screen as the starting point for your own dashboard content.
 */
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { useLogout } from "@/hooks/resources/dev/Auth.r";
import { useMe } from "@/hooks/resources/dev/User.r";
import { useTheme } from "@/theme";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UserHome() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: me, isLoading } = useMe();
  const { mutate: logout, isPending } = useLogout();

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
      <Text size="xl" medium>
        Dashboard
      </Text>

      <SectionCard borderColor={theme.border}>
        {isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <>
            <Text medium>{me?.name}</Text>
            <Text size="sm" dim>
              {me?.email}
            </Text>
          </>
        )}
      </SectionCard>

      <Button
        title="Sign out"
        variant="outline"
        loading={isPending}
        onPress={() => logout()}
      />
    </View>
  );
}
