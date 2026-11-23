/**
 * components/dev/guideBlocks.tsx
 * Small layout pieces shared by the guide screens (Home and Data).
 * Example-only: safe to delete with the rest of components/dev.
 */
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme";
import React from "react";
import { View } from "react-native";

/** A screen section heading with an optional one-line description. */
export function SectionTitle({ title, text }: { title: string; text?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text size="xl" bold>
        {title}
      </Text>
      {text ? (
        <Text size="sm" dim>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

/** An icon tile next to a title and a short text. */
export function IconRow({
  icon,
  title,
  text,
}: {
  icon: IconName;
  title: string;
  text: string;
}) {
  const { theme, radius, spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm + 2 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.sm,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.backgroundSecondary,
        }}
      >
        <Icon name={icon} size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text medium>{title}</Text>
        <Text size="sm" dim>
          {text}
        </Text>
      </View>
    </View>
  );
}

/** A plain bulleted list. */
export function Bullets({ items }: { items: string[] }) {
  const { theme, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: "row", gap: spacing.sm }}>
          <Text size="sm" style={{ color: theme.primary }}>
            •
          </Text>
          <Text size="sm" dim style={{ flex: 1 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}
