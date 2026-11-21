/**
 * components/ui/checkbox.tsx
 * ─────────────────────────────────────────────────────────────
 *   <Checkbox checked={agree} onChange={setAgree} label="I agree" />
 *
 * Props   checked, onChange(checked), label, hint, error, disabled,
 *         indeterminate (shows a dash, for "some selected"),
 *         size (sm | md | lg, default md), style.
 * The whole row is the touch target.
 * ─────────────────────────────────────────────────────────────
 */
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  CONTROL_BORDER,
  controlMetrics,
  DISABLED_OPACITY,
  palette,
  useTheme,
  type ControlSize,
} from "@/theme";
import React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  size?: ControlSize;
  style?: StyleProp<ViewStyle>;
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  error,
  disabled = false,
  indeterminate = false,
  size = "md",
  style,
}: CheckboxProps) {
  const { theme, radius } = useTheme();
  const m = controlMetrics(size);
  const boxSize = m.icon + 6;
  const on = checked || indeterminate;

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: indeterminate ? "mixed" : checked,
        disabled,
      }}
      style={[
        {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: m.gap + 2,
          opacity: disabled ? DISABLED_OPACITY : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width: boxSize,
          height: boxSize,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.xs,
          borderWidth: CONTROL_BORDER,
          borderColor: error
            ? theme.error
            : on
              ? theme.primary
              : theme.borderStrong,
          backgroundColor: on ? theme.primary : theme.surface,
        }}
      >
        {on ? (
          <Icon
            name={indeterminate ? "remove" : "checkmark"}
            size={m.icon}
            color={palette.white}
          />
        ) : null}
      </View>

      {label || hint || error ? (
        <View style={{ flex: 1 }}>
          {label ? <Text size={m.font}>{label}</Text> : null}
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
      ) : null}
    </Pressable>
  );
}
