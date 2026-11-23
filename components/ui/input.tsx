/**
 * components/ui/input.tsx
 * ─────────────────────────────────────────────────────────────
 * Single-line text input.
 *
 *   <Input label="Email" leftIcon="mail-outline" value={v} onChangeText={set}
 *          error={fieldErrors.email} />
 *   <Input label="Password" showPasswordToggle secureTextEntry ... />
 *
 * Props   label, hint, error, size (sm | md | lg, default md), disabled,
 *         leftIcon / rightIcon (Ionicons names), onRightIconPress,
 *         showPasswordToggle, containerStyle. Every TextInput prop passes
 *         through, and the ref points at the TextInput.
 * Border  border color by default, primary when focused, error when invalid.
 * Font    family and size come from theme/typography.ts.
 * ─────────────────────────────────────────────────────────────
 */
import {
  controlMetrics,
  fontFamilyOf,
  scaledFont,
  useTheme,
  type ControlSize,
} from "@/theme";
import React, { useState } from "react";
import {
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Field, useFieldBox, type TextInputRef } from "./field";
import { Icon, type IconName } from "./icon";

export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  size?: ControlSize;
  disabled?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  showPasswordToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = React.forwardRef<TextInputRef, InputProps>(function Input(
  {
    label,
    hint,
    error,
    size = "md",
    disabled = false,
    leftIcon,
    rightIcon,
    onRightIconPress,
    showPasswordToggle = false,
    containerStyle,
    style,
    secureTextEntry,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const { theme } = useTheme();
  const m = controlMetrics(size);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const box = useFieldBox({ error, focused, disabled });

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      containerStyle={containerStyle}
    >
      <View
        style={[
          box,
          {
            height: m.height,
            alignItems: "center",
            paddingHorizontal: m.paddingX,
            gap: m.gap,
          },
        ]}
      >
        {leftIcon ? (
          <Icon name={leftIcon} size={m.icon} color={theme.textTertiary} />
        ) : null}

        <TextInput
          ref={ref}
          {...props}
          editable={!disabled}
          secureTextEntry={showPasswordToggle ? hidden : secureTextEntry}
          placeholderTextColor={theme.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              height: "100%",
              paddingVertical: 0,
              color: theme.textPrimary,
              fontFamily: fontFamilyOf(),
              fontSize: scaledFont(m.font),
            },
            style,
          ]}
        />

        {showPasswordToggle ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Icon
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={m.icon}
              color={theme.textTertiary}
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={8}
            accessibilityRole={onRightIconPress ? "button" : undefined}
          >
            <Icon name={rightIcon} size={m.icon} color={theme.textTertiary} />
          </Pressable>
        ) : null}
      </View>
    </Field>
  );
});
