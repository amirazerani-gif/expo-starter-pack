/**
 * components/ui/textArea.tsx
 * ─────────────────────────────────────────────────────────────
 * Multi-line text input. Same look and props as Input, except:
 *
 *   rows   visible lines (default 4). Sets the minimum height; the box
 *          grows with the content.
 *
 *   <TextArea label="Notes" rows={4} value={v} onChangeText={set} />
 * ─────────────────────────────────────────────────────────────
 */
import {
  controlMetrics,
  fontFamilyOf,
  scaledFont,
  typography,
  useTheme,
  type ControlSize,
} from "@/theme";
import React, { useState } from "react";
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { verticalScale } from "react-native-size-matters";
import { Field, useFieldBox, type TextInputRef } from "./field";

export interface TextAreaProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  size?: ControlSize;
  disabled?: boolean;
  rows?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextArea = React.forwardRef<TextInputRef, TextAreaProps>(
  function TextArea(
    {
      label,
      hint,
      error,
      size = "md",
      disabled = false,
      rows = 4,
      containerStyle,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) {
    const { theme } = useTheme();
    const m = controlMetrics(size);
    const [focused, setFocused] = useState(false);
    const box = useFieldBox({ error, focused, disabled });

    const fontSize = scaledFont(m.font);
    const lineHeight = Math.round(fontSize * typography.lineHeight);
    const padY = verticalScale(6);

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
              minHeight: rows * lineHeight + padY * 2,
              paddingHorizontal: m.paddingX,
              paddingVertical: padY,
            },
          ]}
        >
          <TextInput
            ref={ref}
            {...props}
            multiline
            editable={!disabled}
            textAlignVertical="top"
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
                padding: 0,
                color: theme.textPrimary,
                fontFamily: fontFamilyOf(),
                fontSize,
                lineHeight,
              },
              style,
            ]}
          />
        </View>
      </Field>
    );
  },
);
