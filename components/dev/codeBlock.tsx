/**
 * components/dev/codeBlock.tsx
 * A monospace block for commands and code. The text is selectable, so a
 * reader can long-press to copy it. It scrolls sideways instead of wrapping.
 * Example-only: safe to delete with the rest of components/dev.
 *
 *   <CodeBlock code="npm run mock" />
 */
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme";
import React from "react";
import { Platform, ScrollView, View } from "react-native";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

export function CodeBlock({ code }: { code: string }) {
  const { theme, radius, spacing } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: radius.sm,
        backgroundColor: theme.backgroundSecondary,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.sm + 2 }}
      >
        <Text selectable size="xs" style={{ fontFamily: MONO }}>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}
