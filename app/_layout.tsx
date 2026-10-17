/**
 * app/_layout.tsx
 * Root layout: the app's global setup and provider tree.
 *
 * Boot sequence: the splash screen stays visible until fonts are loaded and
 * the stored auth token has been read (`hydrate()`), so route guards never
 * see an undetermined auth state. /me loads later, in the background.
 *
 * Provider tree: gestures > query client > safe area > navigation theme.
 * <ErrorToastListener /> and <Toaster /> sit inside it to display global
 * errors. useConnectivityGuard sends the user to /no-internet while offline
 * and back to the previous route when the connection returns.
 *
 * To add a global provider, wrap it inside RootLayoutNav. Register new
 * top-level route groups as <Stack.Screen /> entries below.
 */
import { ErrorToastListener } from "@/hooks/core/useErrorListener";
import { appFonts } from "@/lib/fonts";
import { queryClient, useAppFocus } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/dev/auth.store";
import NetInfo from "@react-native-community/netinfo";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

// Silence console output in production builds.
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

// Connectivity is verified against a real endpoint, not just the radio state.
NetInfo.configure({
  reachabilityUrl: "https://clients3.google.com/generate_204",
  reachabilityTest: async (r) => r.status === 204,
  reachabilityRequestTimeout: 15_000,
  reachabilityShortTimeout: 5_000,
  reachabilityLongTimeout: 60_000,
});

export { ErrorBoundary } from "expo-router";
export const unstable_settings = { initialRouteName: "(tabs)" };

SplashScreen.preventAutoHideAsync();

// ─── Root ─────────────────────────────────────────────────────
// Gates rendering on fonts and the auth token; hides the splash when both are ready.
export default function RootLayout() {
  const [loaded, error] = useFonts(appFonts);
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  const ready = loaded && authStatus !== "loading";
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return <RootLayoutNav />;
}

// ─── Connectivity guard ───────────────────────────────────────
// Redirects to /no-internet when offline and restores the last route on reconnect.
function useConnectivityGuard() {
  const router = useRouter();
  const segments = useSegments();
  const lastOnlineRoute = useRef<string>("/");

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      if (state.isConnected === null || state.isInternetReachable === null)
        return;

      const isOffline =
        state.isConnected === false || state.isInternetReachable === false;
      const onNoInternet = segments.join("/").includes("no-internet");

      if (isOffline && !onNoInternet) {
        lastOnlineRoute.current = "/" + segments.join("/");
        router.replace("/no-internet");
      }
      if (!isOffline && onNoInternet) {
        router.replace(lastOnlineRoute.current as any);
      }
    });
  }, [segments]);
}

// ─── Nav tree ─────────────────────────────────────────────────
// Providers, the root Stack and the global error toasts.
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  useConnectivityGuard();
  useAppFocus();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                gestureDirection: "horizontal",
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(dashboard)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="no-internet"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  animation: "fade",
                }}
              />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>
            <ErrorToastListener />
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
