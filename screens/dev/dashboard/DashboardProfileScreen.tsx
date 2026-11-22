/**
 * screens/dev/dashboard/DashboardProfileScreen.tsx
 * Profile demo: view the signed-in user (useMe), edit it with inline
 * validation errors (useUpdateMe). Example-only.
 *
 * Inline errors: useUpdateMe sets `skipGlobalError`, so a 4xx is not toasted.
 * The screen reads it as `unknown`, narrows with isApiError and shows
 * `error.fieldErrors` under each input. 5xx and network failures still toast.
 *
 * The mock cannot fail on demand, so the second button sends a
 * `Prefer: code=422` header, which Prism answers with the spec's 422 example.
 * That header is a Prism feature: remove the button against a real backend.
 */
import { isApiError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { toast } from "@/components/ui/toast";
import { useMe, useUpdateMe } from "@/hooks/resources/dev/User.r";
import { useTheme } from "@/theme";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardProfileScreen() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: me, isLoading } = useMe();
  const { mutate, isPending, error } = useUpdateMe();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Fill the form once per user, so a refetch never overwrites what is typed.
  useEffect(() => {
    if (me) {
      setName(me.name);
      setEmail(me.email);
    }
  }, [me?.id]);

  const failure: unknown = error;
  const inline = isApiError(failure) && failure.status < 500 ? failure : null;
  const fields = inline?.fieldErrors ?? {};
  const general =
    inline && !fields.name && !fields.email ? inline.message : null;

  // Send only the fields that changed.
  const body: { name?: string; email?: string } = {};
  if (me && name !== me.name) body.name = name;
  if (me && email !== me.email) body.email = email;
  const changed = Object.keys(body).length > 0;

  const onSuccess = (res: { message: string }) => toast.success(res.message);
  const save = () => mutate({ body }, { onSuccess });
  const saveForced422 = () =>
    mutate({ body, headers: { Prefer: "code=422" } }, { onSuccess });

  if (isLoading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ padding: spacing.md }}
      >
        <ActivityIndicator color={theme.primary} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        padding: spacing.md,
        paddingBottom: insets.bottom + spacing.md,
        gap: spacing.md,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={{ gap: spacing.md }}>
        <Text size="lg" semibold>
          Edit profile
        </Text>
        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          error={fields.name}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={fields.email}
        />
        {general ? (
          <Text size="xs" style={{ color: theme.error }}>
            {general}
          </Text>
        ) : null}
        <Button
          title="Save changes"
          loading={isPending}
          disabled={!changed}
          onPress={save}
        />
        <Button
          title="Save and force a 422 (mock only)"
          variant="outline"
          disabled={isPending}
          onPress={saveForced422}
        />
        <Text size="xs" dim>
          useMe() and useUpdateMe(): hooks/resources/dev/User.r.ts
        </Text>
      </Card>
    </ScrollView>
  );
}
