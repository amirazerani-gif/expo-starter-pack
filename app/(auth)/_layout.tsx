/**
 * app/(auth)/_layout.tsx
 * Stack navigator for the unauthenticated screens (login, and signup or
 * password reset if you add them). Add new auth screens as files in this folder.
 */
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
