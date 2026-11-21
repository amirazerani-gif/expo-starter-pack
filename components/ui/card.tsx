/**
 * components/ui/card.tsx
 * ─────────────────────────────────────────────────────────────
 * A bordered surface that groups content.
 *
 *   <Card>...</Card>                                 surface + border
 *   <Card bg={theme.backgroundSecondary} bordered={false}>
 *   <Card gradient={[theme.primary, theme.primaryDark]}>
 *
 * Props   bg (default theme.surface), gradient (overrides bg),
 *         gradientStart / gradientEnd, bordered (default true),
 *         padding (default spacing.md), style. ViewProps pass through.
 * ─────────────────────────────────────────────────────────────
 */
import { useTheme } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

export interface CardProps extends Omit<ViewProps, "style"> {
  bg?: string;
  gradient?: [string, string, ...string[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  bordered?: boolean;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Card({
  bg,
  gradient,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 1 },
  bordered = true,
  padding,
  style,
  children,
  ...props
}: CardProps) {
  const { theme, radius, spacing } = useTheme();

  const base: ViewStyle = {
    borderRadius: radius.md,
    padding: padding ?? spacing.md,
    overflow: "hidden",
    borderWidth: bordered ? 1 : 0,
    borderColor: theme.border,
  };

  if (gradient) {
    return (
      <LinearGradient
        {...props}
        colors={gradient}
        start={gradientStart}
        end={gradientEnd}
        style={[base, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      {...props}
      style={[base, { backgroundColor: bg ?? theme.surface }, style]}
    >
      {children}
    </View>
  );
}
