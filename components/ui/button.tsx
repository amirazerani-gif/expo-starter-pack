/**
 * components/ui/button.tsx
 * ─────────────────────────────────────────────────────────────
 *   <Button title="Save" onPress={save} />                 solid, md
 *   <Button title="Cancel" variant="outline" onPress={x} />
 *   <Button title="Next" rightIcon="arrow-forward" onPress={x} />
 *
 * Variants   solid (default) | outline | ghost | gradient
 *            solid and gradient: primary background, white label.
 *            outline and ghost: transparent, primary label.
 * Sizes      sm | md (default) | lg   (see theme/sizes.ts)
 * Label      font weight is typography.controlWeight (theme/typography.ts)
 * Props      loading, loadingTitle, disabled, fullWidth (default true),
 *            leftIcon / rightIcon (Ionicons names), labelColor,
 *            gradientColors, style. Other Pressable props pass through.
 * ─────────────────────────────────────────────────────────────
 */
import {
  CONTROL_BORDER,
  controlMetrics,
  DISABLED_OPACITY,
  palette,
  PRESSED_OPACITY,
  typography,
  useTheme,
  type ControlSize,
} from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Icon, type IconName } from "./icon";
import { Text } from "./text";

export type ButtonVariant = "solid" | "outline" | "ghost" | "gradient";

export interface ButtonProps extends Omit<
  PressableProps,
  "style" | "children" | "onPress"
> {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ControlSize;
  loading?: boolean;
  /** Replaces the title while loading. */
  loadingTitle?: string;
  fullWidth?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  /** Overrides the label and icon color. */
  labelColor?: string;
  /** Only used when variant="gradient". */
  gradientColors?: [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = "solid",
  size = "md",
  loading = false,
  loadingTitle,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  labelColor,
  gradientColors,
  style,
  ...rest
}: ButtonProps) {
  const { theme, radius } = useTheme();
  const m = controlMetrics(size);
  const isDisabled = disabled || loading;

  const filled = variant === "solid" || variant === "gradient";
  const color = labelColor ?? (filled ? palette.white : theme.primary);

  const content = (
    <View
      pointerEvents="none"
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: m.gap,
        paddingHorizontal: m.paddingX,
        backgroundColor: variant === "solid" ? theme.primary : "transparent",
        borderWidth: CONTROL_BORDER,
        borderColor: variant === "outline" ? theme.primary : "transparent",
        borderRadius: radius.sm,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : leftIcon ? (
        <Icon name={leftIcon} size={m.icon} color={color} />
      ) : null}
      <Text size={m.font} weight={typography.controlWeight} style={{ color }}>
        {loading && loadingTitle ? loadingTitle : title}
      </Text>
      {!loading && rightIcon ? (
        <Icon name={rightIcon} size={m.icon} color={color} />
      ) : null}
    </View>
  );

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={m.hitSlop}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        {
          height: m.height,
          borderRadius: radius.sm,
          overflow: "hidden",
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: isDisabled
            ? DISABLED_OPACITY
            : pressed
              ? PRESSED_OPACITY
              : 1,
        },
        style,
      ]}
    >
      {variant === "gradient" && (
        <LinearGradient
          colors={gradientColors ?? [theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {content}
    </Pressable>
  );
}
