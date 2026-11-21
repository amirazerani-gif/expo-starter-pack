/**
 * components/ui/field.tsx
 * ─────────────────────────────────────────────────────────────
 * Shared pieces of every form control (Input, TextArea, and any
 * control you add): the label / hint / error wrapper and the box style.
 * The label's font weight is typography.labelWeight (theme/typography.ts).
 *
 *   <Field label="Email" error={error} hint="We never share it">
 *     <View style={[box, ...]}>...</View>
 *   </Field>
 *   const box = useFieldBox({ error, focused, disabled });
 * ─────────────────────────────────────────────────────────────
 */
import {
  CONTROL_BORDER,
  DISABLED_OPACITY,
  typography,
  useTheme,
} from "@/theme";
import React from "react";
import {
  View,
  type StyleProp,
  type TextInput,
  type ViewStyle,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { Text } from "./text";

/** The instance type of a TextInput ref (TextInput is a function component type in RN 0.87+). */
export type TextInputRef = React.ComponentRef<typeof TextInput>;

export interface FieldProps {
  label?: string;
  /** Helper text under the field. Hidden while an error is shown. */
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function Field({
  label,
  hint,
  error,
  containerStyle,
  children,
}: FieldProps) {
  const { theme } = useTheme();
  return (
    <View style={[{ gap: moderateScale(6) }, containerStyle]}>
      {label ? (
        <Text size="sm" weight={typography.labelWeight}>
          {label}
        </Text>
      ) : null}
      {children}
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
  );
}

/** Border, radius, background and disabled look of a control's box. */
export function useFieldBox({
  error,
  focused,
  disabled,
}: {
  error?: string;
  focused: boolean;
  disabled?: boolean;
}): ViewStyle {
  const { theme, radius } = useTheme();
  return {
    flexDirection: "row",
    borderWidth: CONTROL_BORDER,
    borderRadius: radius.sm,
    borderColor: error ? theme.error : focused ? theme.primary : theme.border,
    backgroundColor: theme.surface,
    opacity: disabled ? DISABLED_OPACITY : 1,
  };
}
