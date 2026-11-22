/**
 * screens/dev/DataScreen.tsx
 * The second public screen: how data moves through the app, from a screen to
 * the backend and back, and how that connects to navigation.
 *
 * No logic of its own. The text lives in lib/constants/dev/dataContent.ts and
 * the building blocks in components/dev. Example-only: safe to delete (see
 * "Safe to delete" on the Home screen).
 */
import { CodeBlock } from "@/components/dev/codeBlock";
import { Collapsible } from "@/components/dev/collapsible";
import { Bullets, IconRow, SectionTitle } from "@/components/dev/guideBlocks";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/tabbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import {
  DATA_END,
  DATA_GROUPS,
  DATA_INTRO,
  FLOW,
  STATE_SPLIT,
} from "@/lib/constants/dev/dataContent";
import { useAuthStore } from "@/stores/dev/auth.store";
import { useTheme } from "@/theme";
import { router } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DataScreen() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.status === "authed");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        padding: spacing.md,
        paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
        gap: spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
    >
      <SectionTitle title={DATA_INTRO.title} text={DATA_INTRO.text} />

      {/* ── The request path ─────────────────────────────────── */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle
          title="How a request flows"
          text="Top to bottom, and back up."
        />
        <Card style={{ gap: spacing.md }}>
          {FLOW.map((step, index) => (
            <View
              key={step.title}
              style={{ flexDirection: "row", gap: spacing.sm }}
            >
              <Badge label={String(index + 1)} tone="primary" variant="solid" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text medium>{step.title}</Text>
                <Text size="xs" dim style={{ color: theme.primary }}>
                  {step.file}
                </Text>
                <Text size="sm" dim>
                  {step.text}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* ── Server state vs app state ────────────────────────── */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle
          title="Two kinds of state"
          text="Keeping them apart avoids most data bugs."
        />
        <Card style={{ gap: spacing.md }}>
          {STATE_SPLIT.map((item) => (
            <IconRow key={item.title} {...item} />
          ))}
        </Card>
      </View>

      {/* ── Topic groups ─────────────────────────────────────── */}
      {DATA_GROUPS.map((group, groupIndex) => (
        <View key={group.id} style={{ gap: spacing.sm }}>
          <SectionTitle title={group.title} text={group.text} />
          {group.topics.map((topic, index) => (
            <Collapsible
              key={topic.id}
              title={topic.title}
              subtitle={topic.summary}
              defaultOpen={groupIndex === 0 && index === 0}
            >
              <Text size="sm" dim>
                {topic.text}
              </Text>
              {topic.points ? <Bullets items={topic.points} /> : null}
              {topic.code ? <CodeBlock code={topic.code} /> : null}
              {topic.file ? (
                <Text size="xs" dim>
                  {topic.file}
                </Text>
              ) : null}
            </Collapsible>
          ))}
        </View>
      ))}

      {/* ── End ──────────────────────────────────────────────── */}
      <Card style={{ gap: spacing.sm }}>
        <Text size="lg" semibold>
          {DATA_END.title}
        </Text>
        <Text size="sm" dim>
          {DATA_END.text}
        </Text>
        <Button
          title={
            isAuthenticated ? "Open the demo dashboard" : "Sign in to the demo"
          }
          rightIcon="arrow-forward"
          onPress={() =>
            router.push(isAuthenticated ? "/(dashboard)/dev" : "/(auth)/login")
          }
        />
      </Card>
    </ScrollView>
  );
}
