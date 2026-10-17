/**
 * app/(dashboard)/_layout.tsx
 * Route guard for the authenticated area. Everything under (dashboard) is
 * only reachable while signed in.
 *
 * Behavior:
 *  - guests are redirected to the login screen
 *  - signed-in users landing outside a known group are sent to DEFAULT_GROUP
 *  - ending the session anywhere (logout, 401) re-runs the guard and
 *    returns the user to login automatically
 * The root layout holds the splash until the stored token is read, so the
 * status here is always "authed" or "guest", never "loading".
 *
 * Adding a group (e.g. app/(dashboard)/admin/):
 *   1. create the folder with its _layout.tsx and screens
 *   2. add its name to VALID_DASHBOARD_GROUPS
 *
 * Roles: the template does no role branching, because roles are server
 * state, not auth state. If your backend has roles, read the role from
 * useMe() here and redirect to the matching group.
 */
import { useAuthStore } from "@/stores/dev/auth.store";
import { useTheme } from "@/theme";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/** Top-level groups directly under (dashboard) that are valid destinations. */
const VALID_DASHBOARD_GROUPS = ["user"];
/** Where signed-in users land when no valid group is in the URL. */
const DEFAULT_GROUP = "user";

export default function DashboardLayout() {
  const isAuthenticated = useAuthStore((s) => s.status === "authed");
  const segments = useSegments();
  const router = useRouter();
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    const currentGroup = segments[1];

    if (!currentGroup || !VALID_DASHBOARD_GROUPS.includes(currentGroup)) {
      router.replace(`/(dashboard)/${DEFAULT_GROUP}` as any);
    } else {
      setReady(true);
    }
  }, [isAuthenticated, segments]);

  if (!isAuthenticated || !ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <Slot />;
}
