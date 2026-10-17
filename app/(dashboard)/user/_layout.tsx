/**
 * app/(dashboard)/user/_layout.tsx
 * Navigator for the `user` dashboard group. A plain Stack by default; swap
 * it for <Tabs> or a drawer here if the group needs different navigation.
 * The auth guard lives one level up and needs no changes.
 */
import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: "slide_from_right",
      }}
    />
  );
}
