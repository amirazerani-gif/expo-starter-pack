/**
 * app/(dashboard)/dev/_layout.tsx
 * Navigator for the `dev` dashboard group (example only). A Stack that uses
 * the app header, so each screen only sets a title. Swap the Stack for
 * <Tabs> or a drawer here if the group needs different navigation. The auth
 * guard lives one level up and needs no changes.
 */
import { AppHeader } from "@/components/navigation/header";
import { Stack } from "expo-router";

export default function DevLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ options, route }) => (
          <AppHeader title={options.title ?? route.name} />
        ),
        gestureEnabled: true,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Dashboard" }} />
      <Stack.Screen name="items" options={{ title: "Items" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
    </Stack>
  );
}
