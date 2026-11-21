/**
 * components/ui/radioGroup.tsx
 * ─────────────────────────────────────────────────────────────
 * One choice from a short list.
 *
 *   <RadioGroup
 *     label="Plan"
 *     value={plan}
 *     onChange={setPlan}
 *     options={[
 *       { label: "Free", value: "free" },
 *       { label: "Pro", value: "pro", hint: "Billed monthly" },
 *     ]}
 *   />
 *
 * Props   options ({ label, value, hint?, disabled? }), value, onChange,
 *         label, hint, error (shown through Field), direction
 *         (vertical | horizontal), size, disabled.
 * Value   string or number; onChange receives the option's own type.
 * ─────────────────────────────────────────────────────────────
 */
import { Field } from "@/components/ui/field";
import { Text } from "@/components/ui/text";
import {
  CONTROL_BORDER,
  controlMetrics,
  DISABLED_OPACITY,
  useTheme,
  type ControlSize,
} from "@/theme";
import React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

export interface RadioOption<T extends string | number> {
  label: string;
  value: T;
  hint?: string;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string | number> {
  options: RadioOption<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  label?: string;
  hint?: string;
  error?: string;
  direction?: "vertical" | "horizontal";
  size?: ControlSize;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function RadioGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
  hint,
  error,
  direction = "vertical",
  size = "md",
  disabled = false,
  containerStyle,
}: RadioGroupProps<T>) {
  const { theme, spacing } = useTheme();
  const m = controlMetrics(size);
  const circle = m.icon + 6;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      containerStyle={containerStyle}
    >
      <View
        accessibilityRole="radiogroup"
        style={{
          flexDirection: direction === "vertical" ? "column" : "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          columnGap: spacing.lg,
        }}
      >
        {options.map((option) => {
          const selected = option.value === value;
          const off = disabled || option.disabled;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              disabled={off}
              hitSlop={6}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: off }}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: m.gap + 2,
                opacity: off ? DISABLED_OPACITY : 1,
              }}
            >
              <View
                style={{
                  width: circle,
                  height: circle,
                  borderRadius: circle / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: CONTROL_BORDER,
                  borderColor: error
                    ? theme.error
                    : selected
                      ? theme.primary
                      : theme.borderStrong,
                  backgroundColor: theme.surface,
                }}
              >
                {selected ? (
                  <View
                    style={{
                      width: circle / 2,
                      height: circle / 2,
                      borderRadius: circle / 4,
                      backgroundColor: theme.primary,
                    }}
                  />
                ) : null}
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text size={m.font}>{option.label}</Text>
                {option.hint ? (
                  <Text size="xs" dim>
                    {option.hint}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Field>
  );
}
