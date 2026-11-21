/**
 * app/(tabs)/index.tsx
 * Interim UI kit preview on the standardized components. It is replaced by
 * the Home screen in the example-app redesign.
 */
import { TAB_BAR_CLEARANCE } from "@/components/navigation/tabbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { TextArea } from "@/components/ui/textArea";
import { useTheme } from "@/theme";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text size="xs" dim medium>
        {title.toUpperCase()}
      </Text>
      <Card style={{ gap: spacing.sm }}>{children}</Card>
    </View>
  );
}

export default function KitPreview() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        padding: spacing.md,
        paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
        gap: spacing.md,
      }}
    >
      <Section title="Text">
        <Text size="xxl" bold>
          Heading xxl
        </Text>
        <Text size="xl" medium>
          Heading xl
        </Text>
        <Text size="lg">Large lg</Text>
        <Text>Body md</Text>
        <Text size="sm" dim>
          Secondary sm
        </Text>
        <Text size="xs" dim>
          Caption xs
        </Text>
      </Section>

      <Section title="Button variants">
        <Button title="Solid" onPress={() => {}} />
        <Button title="Outline" variant="outline" onPress={() => {}} />
        <Button title="Ghost" variant="ghost" onPress={() => {}} />
        <Button title="Gradient" variant="gradient" onPress={() => {}} />
      </Section>

      <Section title="Button sizes, icons, states">
        <Button
          title="Large"
          size="lg"
          leftIcon="mail-outline"
          onPress={() => {}}
        />
        <Button
          title="Medium"
          size="md"
          rightIcon="arrow-forward"
          onPress={() => {}}
        />
        <Button title="Small" size="sm" leftIcon="search" onPress={() => {}} />
        <Button
          title="Tap to load"
          loading={loading}
          loadingTitle="Please wait…"
          onPress={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 2000);
          }}
        />
        <Button title="Disabled" disabled onPress={() => {}} />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Button title="Auto width" fullWidth={false} onPress={() => {}} />
          <Button
            title="Outline"
            variant="outline"
            fullWidth={false}
            onPress={() => {}}
          />
        </View>
      </Section>

      <Section title="Inputs">
        <Input
          label="Email"
          placeholder="name@example.com"
          leftIcon="mail-outline"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          hint="We never share it"
        />
        <Input
          label="Password"
          placeholder="Your password"
          leftIcon="lock-closed-outline"
          showPasswordToggle
          secureTextEntry
        />
        <Input label="Large" size="lg" placeholder="size lg" />
        <Input label="Small" size="sm" placeholder="size sm" />
        <Input label="With error" error="This field is required" />
        <Input label="Disabled" disabled value="Locked value" />
        <TextArea
          label="Notes"
          placeholder="Write something…"
          value={note}
          onChangeText={setNote}
          rows={4}
        />
      </Section>

      <Section title="Cards">
        <Card bordered={false} bg={theme.backgroundSecondary}>
          <Text medium>Filled, no border</Text>
        </Card>
        <Card gradient={[theme.primary, theme.primaryDark]}>
          <Text inverse medium>
            Gradient card
          </Text>
        </Card>
      </Section>
    </ScrollView>
  );
}
