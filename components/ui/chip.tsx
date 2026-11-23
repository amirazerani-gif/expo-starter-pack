/**
 * components/ui/chip.tsx
 * ─────────────────────────────────────────────────────────────
 * A pill that can be tapped, selected or removed: filters, tags, choices.
 *
 *   <Chip label="Open" selected={filter === "open"} onPress={...} />
 *   <Chip label="design" leftIcon="pricetag-outline" onRemove={...} />
 *
 * Props   label, selected, onPress, onRemove (shows a close icon),
 *         leftIcon, disabled, size (sm | md | lg, default md), style.
 * Selected chips use the primary color; others a surface with a border.
 * ─────────────────────────────────────────────────────────────
 */
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  CONTROL_BORDER,
  controlMetrics,
  DISABLED_OPACITY,
  PRESSED_OPACITY,
  palette,
  typography,
  useTheme,
  type ControlSize,
} from "@/theme";
import React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  leftIcon?: IconName;
  disabled?: boolean;
  size?: ControlSize;
  style?: StyleProp<ViewStyle>;
}

export function Chip({
  label,
  selected = false,
  onPress,
  onRemove,
  leftIcon,
  disabled = false,
  size = "md",
  style,
}: ChipProps) {
  const { theme, radius } = useTheme();
  const m = controlMetrics(size);
  const color = selected ? palette.white : theme.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      hitSlop={m.hitSlop}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        {
          alignSelf: "flex-start",
          height: m.height,
          flexDirection: "row",
          alignItems: "center",
          gap: m.gap - 2,
          paddingHorizontal: m.paddingX - 2,
          borderRadius: radius.full,
          borderWidth: CONTROL_BORDER,
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? theme.primary : theme.surface,
          opacity: disabled
            ? DISABLED_OPACITY
            : pressed && onPress
              ? PRESSED_OPACITY
              : 1,
        },
        style,
      ]}
    >
      {leftIcon ? <Icon name={leftIcon} size={m.icon} color={color} /> : null}
      <Text size={m.font} weight={typography.controlWeight} style={{ color }}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
        >
          <Icon name="close" size={m.icon} color={color} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
