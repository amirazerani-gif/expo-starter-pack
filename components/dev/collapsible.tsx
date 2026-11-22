/**
 * components/dev/collapsible.tsx
 * A titled section that expands and collapses. Used by the guide screens
 * (Home and Data); it is not part of the UI kit and is safe to delete with
 * the rest of components/dev.
 *
 *   <Collapsible title="Button" defaultOpen>...</Collapsible>
 */
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

type CollapsibleProps = {
  title: string;
  /** One line under the title while collapsed or open. */
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function Collapsible({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: CollapsibleProps) {
  const { theme, radius, spacing } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: radius.md,
        backgroundColor: theme.surface,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          padding: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text medium>{title}</Text>
          {subtitle ? (
            <Text size="xs" dim>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Icon
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.textSecondary}
        />
      </Pressable>

      {open ? (
        <View
          style={{
            gap: spacing.md,
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.border,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}
