/**
 * components/ui/text.tsx
 * ─────────────────────────────────────────────────────────────
 * The app's text. Font, weights and sizes come from the global
 * typography config (theme/typography.ts); color comes from the theme.
 *
 *   <Text>Body</Text>
 *   <Text size="xl" bold>Title</Text>
 *   <Text size="sm" dim>Secondary</Text>
 *   <Text inverse>On a primary background</Text>
 *   <Text weight="semibold">Explicit weight</Text>
 *
 * Props   size     xs | sm | md | lg | xl | xxl (default md)
 *         weight   regular | medium | semibold | bold
 *         family   a family from fontFamilies (default: typography.defaultFamily)
 *         medium, semibold, bold   shortcuts for weight
 *         dim      secondary text color
 *         inverse  text color for primary backgrounds
 * A `color`, `fontSize`, `lineHeight` or `fontFamily` in `style` wins.
 * ─────────────────────────────────────────────────────────────
 */
import {
  fontFamilyOf,
  scaledFont,
  typography,
  useTheme,
  type FontFamily,
  type FontWeight,
  type TextSize,
} from "@/theme";
import React from "react";
import type { TextProps as RNTextProps } from "react-native";
import { Text as RNText, StyleSheet } from "react-native";

interface TextProps extends RNTextProps {
  size?: TextSize;
  weight?: FontWeight;
  family?: FontFamily;
  medium?: boolean;
  semibold?: boolean;
  bold?: boolean;
  dim?: boolean;
  inverse?: boolean;
}

export const Text = React.forwardRef<
  React.ComponentRef<typeof RNText>,
  TextProps
>(
  (
    {
      size = "md",
      weight,
      family,
      medium,
      semibold,
      bold,
      dim,
      inverse,
      style,
      ...props
    },
    ref,
  ) => {
    const { theme } = useTheme();

    // An undefined value in `style` must not override the computed one.
    const {
      color: styleColor,
      fontSize: styleFontSize,
      lineHeight: styleLineHeight,
      fontFamily: styleFontFamily,
      ...rest
    } = StyleSheet.flatten(style) ?? {};

    const fontSize =
      typeof styleFontSize === "number" ? styleFontSize : scaledFont(size);
    const lineHeight =
      typeof styleLineHeight === "number"
        ? styleLineHeight
        : Math.round(fontSize * typography.lineHeight);

    const themed = inverse
      ? theme.textInverse
      : dim
        ? theme.textSecondary
        : theme.textPrimary;

    const resolvedWeight: FontWeight | undefined =
      weight ??
      (bold ? "bold" : semibold ? "semibold" : medium ? "medium" : undefined);

    return (
      <RNText
        ref={ref}
        allowFontScaling={false}
        {...props}
        style={{
          ...rest,
          color: typeof styleColor === "string" ? styleColor : themed,
          fontFamily: styleFontFamily ?? fontFamilyOf(resolvedWeight, family),
          fontSize,
          lineHeight,
        }}
      />
    );
  },
);

Text.displayName = "Text";
