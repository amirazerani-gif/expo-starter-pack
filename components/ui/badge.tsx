/**
 * components/ui/badge.tsx
 * ─────────────────────────────────────────────────────────────
 * A small non-interactive status label, count or dot.
 *
 *   <Badge label="New" tone="primary" />
 *   <Badge label="Paid" tone="success" variant="outline" />
 *   <Badge count={128} max={99} tone="error" variant="solid" />   99+
 *   <Badge dot tone="success" />
 *
 * Tones     neutral (default) | primary | success | warning | error | info
 * Variants  soft (default) | solid | outline
 * Sizes     sm | md (default) | lg
 *           A badge is an indicator, not a control, so it has its own
 *           compact scale instead of the control heights.
 * Props     label, count + max (a number; over max shows "max+"),
 *           dot (a small circle, no text), leftIcon, style.
 * ─────────────────────────────────────────────────────────────
 */
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { palette, useTheme } from "@/theme";
import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";

/** Returns a #RRGGBB color as an rgba() string at the given opacity. */
function withAlpha(color: string, alpha: number) {
  const n = parseInt(color.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";
export type BadgeVariant = "soft" | "solid" | "outline";
export type BadgeSize = "sm" | "md" | "lg";

const SPEC = {
  sm: { height: 16, font: "xs", paddingX: 6, icon: 10, dot: 6 },
  md: { height: 20, font: "xs", paddingX: 8, icon: 12, dot: 8 },
  lg: { height: 24, font: "sm", paddingX: 10, icon: 14, dot: 10 },
} as const;

export interface BadgeProps {
  label?: string;
  count?: number;
  max?: number;
  dot?: boolean;
  leftIcon?: IconName;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  label,
  count,
  max = 99,
  dot = false,
  leftIcon,
  tone = "neutral",
  variant = "soft",
  size = "md",
  style,
}: BadgeProps) {
  const { theme, radius } = useTheme();
  const spec = SPEC[size];

  const color = {
    neutral: theme.textSecondary,
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
    info: theme.info,
  }[tone];

  if (dot) {
    const d = moderateScale(spec.dot);
    return (
      <View
        style={[
          { width: d, height: d, borderRadius: d / 2, backgroundColor: color },
          style,
        ]}
      />
    );
  }

  const text =
    count !== undefined ? (count > max ? `${max}+` : String(count)) : label;

  const background =
    variant === "solid"
      ? color
      : variant === "soft"
        ? tone === "neutral"
          ? theme.backgroundSecondary
          : withAlpha(color, 0.15)
        : "transparent";
  const textColor = variant === "solid" ? palette.white : color;

  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          minWidth: verticalScale(spec.height),
          height: verticalScale(spec.height),
          paddingHorizontal: moderateScale(spec.paddingX),
          borderRadius: radius.full,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: color,
          backgroundColor: background,
        },
        style,
      ]}
    >
      {leftIcon ? (
        <Icon name={leftIcon} size={moderateScale(spec.icon)} color={textColor} />
      ) : null}
      {text !== undefined ? (
        <Text size={spec.font} medium style={{ color: textColor }}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}
