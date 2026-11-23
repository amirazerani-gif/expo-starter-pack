/**
 * screens/dev/HomeScreen.tsx
 * The first public screen: what the template is, how to start it, how it is
 * organized, how to make it yours, and the UI kit with live examples.
 *
 * It has no logic of its own. The text lives in lib/constants/dev
 * (homeContent.ts and componentDocs.ts), the examples in
 * components/dev/componentDemos.tsx, and the building blocks in
 * components/dev. Everything example-only lives in folders named dev and is
 * safe to delete (see "Safe to delete" on the screen), by hand or with
 * npm run strip-example.
 */
import { CodeBlock } from "@/components/dev/codeBlock";
import { COMPONENT_DEMOS } from "@/components/dev/componentDemos";
import { DocSection } from "@/components/dev/docSection";
import { IconRow, SectionTitle } from "@/components/dev/guideBlocks";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/tabbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { COMPONENT_DOCS } from "@/lib/constants/dev/componentDocs";
import {
  CUSTOMIZE,
  DEMO_DASHBOARD,
  FEATURES,
  HERO,
  QUICK_START,
  QUICK_START_NOTE,
  SAFE_TO_DELETE,
  STRUCTURE,
  UI_GROUPS,
  UI_KIT_INTRO,
} from "@/lib/constants/dev/homeContent";
import { useAuthStore } from "@/stores/dev/auth.store";
import { palette, useTheme } from "@/theme";
import { router } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
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
      {/* ── Hero ─────────────────────────────────────────────── */}
      <View style={{ gap: spacing.md }}>
        <Card
          gradient={[theme.primary, theme.primaryDark]}
          padding={spacing.lg}
          style={{ gap: spacing.sm }}
        >
          <Text size="xxl" bold style={{ color: palette.white }}>
            {HERO.title}
          </Text>
          <Text size="sm" style={{ color: palette.white, opacity: 0.85 }}>
            {HERO.tagline}
          </Text>
        </Card>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
        >
          {HERO.tags.map((tag) => (
            <Badge key={tag} label={tag} tone="primary" />
          ))}
        </View>
      </View>

      {/* ── What you get ─────────────────────────────────────── */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle title="What you get" />
        <Card style={{ gap: spacing.md }}>
          {FEATURES.map((feature) => (
            <IconRow key={feature.title} {...feature} />
          ))}
        </Card>
      </View>

      {/* ── Quick start ──────────────────────────────────────── */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle title="Quick start" text="From zero to a running app." />
        {QUICK_START.map((step, index) => (
          <Card key={step.title} style={{ gap: spacing.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <Badge label={String(index + 1)} tone="primary" variant="solid" />
              <Text medium>{step.title}</Text>
            </View>
            <Text size="sm" dim>
              {step.text}
            </Text>
            {step.code ? <CodeBlock code={step.code} /> : null}
          </Card>
        ))}
        <Text size="xs" dim>
          {QUICK_START_NOTE}
        </Text>
      </View>

      {/* ── Demo dashboard ───────────────────────────────────── */}
      <Card style={{ gap: spacing.sm }}>
        <Text size="lg" semibold>
          {DEMO_DASHBOARD.title}
        </Text>
        <Text size="sm" dim>
          {DEMO_DASHBOARD.text}
        </Text>
        {isAuthenticated ? (
          <Button
            title="Open the demo dashboard"
            rightIcon="arrow-forward"
            onPress={() => router.push("/(dashboard)/dev")}
          />
        ) : (
          <Button
            title="Sign in to the demo"
            rightIcon="arrow-forward"
            onPress={() => router.push("/(auth)/login")}
          />
        )}
      </Card>

      {/* ── Project structure ────────────────────────────────── */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle
          title="Project structure"
          text="Routes stay thin; screens, components and data have their own folders."
        />
        <CodeBlock code={STRUCTURE} />
      </View>

      {/* ── Make it yours ────────────────────────────────────── */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle title="Make it yours" />
        <Card style={{ gap: spacing.md }}>
          {CUSTOMIZE.map((item) => (
            <IconRow key={item.title} {...item} />
          ))}
        </Card>
      </View>

      {/* ── Safe to delete ───────────────────────────────────── */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle title={SAFE_TO_DELETE.title} text={SAFE_TO_DELETE.text} />
        <CodeBlock code={SAFE_TO_DELETE.paths} />
        <Text size="xs" dim>
          {SAFE_TO_DELETE.note}
        </Text>
        <Card style={{ gap: spacing.sm }}>
          <Text medium>{SAFE_TO_DELETE.script.title}</Text>
          <Text size="sm" dim>
            {SAFE_TO_DELETE.script.text}
          </Text>
          <CodeBlock code={SAFE_TO_DELETE.script.code} />
          <Text size="xs" dim>
            {SAFE_TO_DELETE.script.note}
          </Text>
        </Card>
      </View>

      {/* ── UI kit ───────────────────────────────────────────── */}
      <View style={{ gap: spacing.lg }}>
        <SectionTitle title="UI kit" text={UI_KIT_INTRO} />
        {UI_GROUPS.map((group, groupIndex) => (
          <View key={group.key} style={{ gap: spacing.sm }}>
            <View>
              <Text size="lg" semibold>
                {group.title}
              </Text>
              <Text size="xs" dim>
                {group.text}
              </Text>
            </View>
            {COMPONENT_DOCS.filter((doc) => doc.group === group.key).map(
              (doc, index) => {
                const Demo = COMPONENT_DEMOS[doc.id];
                return (
                  <DocSection
                    key={doc.id}
                    doc={doc}
                    defaultOpen={groupIndex === 0 && index === 0}
                  >
                    {Demo ? <Demo /> : null}
                  </DocSection>
                );
              },
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
