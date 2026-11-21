/**
 * components/ui/switch.tsx
 * ─────────────────────────────────────────────────────────────
 * The native switch with theme colors, optionally in a labeled row.
 *
 *   <Switch value={on} onValueChange={setOn} />
 *   <Switch label="Notifications" hint="Sent to your email"
 *           value={on} onValueChange={setOn} />
 *
 * With a label, the whole row toggles. The switch itself keeps the
 * platform's size.
 * ─────────────────────────────────────────────────────────────
 */
import { Text } from "@/components/ui/text";
import { DISABLED_OPACITY, palette, useTheme } from "@/theme";
import React from "react";
import {
  Pressable,
  Switch as RNSwitch,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Switch({
  value,
  onValueChange,
  label,
  hint,
  error,
  disabled = false,
  style,
}: SwitchProps) {
  const { theme, spacing } = useTheme();

  const control = (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: theme.border, true: theme.primary }}
      thumbColor={palette.white}
      ios_backgroundColor={theme.border}
    />
  );

  if (!label) return <View style={style}>{control}</View>;

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          opacity: disabled ? DISABLED_OPACITY : 1,
        },
        style,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text size="sm" medium>
          {label}
        </Text>
        {error ? (
          <Text size="xs" style={{ color: theme.error }}>
            {error}
          </Text>
        ) : hint ? (
          <Text size="xs" dim>
            {hint}
          </Text>
        ) : null}
      </View>
      {control}
    </Pressable>
  );
}
