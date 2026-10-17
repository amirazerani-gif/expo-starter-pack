/**
 * app/(auth)/login.tsx
 * Sign-in screen, wired to useLogin(). Replace the fields to match your
 * backend's credentials.
 *
 * Errors: a 4xx is shown inline (per-field when the server names the field,
 * otherwise as one message under the form). 5xx and network failures are
 * toasted globally and not shown here.
 *
 * Navigation: the effect below is the only place that leaves this screen,
 * so it works after a successful login and when the screen is opened while
 * already signed in. The dashboard guard then picks the final group.
 */
import { isApiError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useLogin } from "@/hooks/resources/dev/Auth.r";
import { useAuthStore } from "@/stores/dev/auth.store";
import { useTheme } from "@/theme";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function LoginScreen() {
  const { theme, spacing } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.status === "authed");

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const { mutate, isPending, error } = useLogin();

  const inline = isApiError(error) && error.status < 500 ? error : null;
  const fieldErrors = inline?.fieldErrors ?? {};
  const hasFieldError = !!(fieldErrors.login || fieldErrors.password);
  const generalError = inline && !hasFieldError ? inline.message : null;

  useEffect(() => {
    if (isAuthenticated) router.replace("/(dashboard)/user");
  }, [isAuthenticated]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: theme.background,
      }}
    >
      <Text size="xl" medium>
        Sign in
      </Text>

      <Input
        label="Email"
        placeholder="name@example.com"
        iconName="mail-outline"
        value={login}
        onChangeText={setLogin}
        keyboardType="email-address"
        autoCapitalize="none"
        error={fieldErrors.login}
      />

      <Input
        label="Password"
        placeholder="Your password"
        iconName="lock-closed-outline"
        showPasswordToggle
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
      />

      {generalError && (
        <Text size="xs" style={{ color: theme.error }}>
          {generalError}
        </Text>
      )}

      <Button
        title="Sign in"
        loading={isPending}
        loadingTitle="Signing in…"
        onPress={() => mutate({ login, password })}
      />
    </View>
  );
}
