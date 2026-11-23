/**
 * components/ui/modal.tsx
 * ─────────────────────────────────────────────────────────────
 * An overlay with four layouts. It adds only an optional header and an
 * optional backdrop; what goes inside is yours.
 *
 *   <Modal visible={open} onClose={() => setOpen(false)} title="Edit item">
 *     ...anything
 *   </Modal>
 *   <Modal variant="sheet" ...>        bottom sheet
 *   <Modal variant="fullscreen" ...>   covers the screen
 *   <Modal variant="drawer" drawerSide="right" drawerWidth={70} ...>
 *
 * Variants  center (default) | sheet | fullscreen | drawer
 * Props     visible, onClose
 *           title            shown in the header
 *           showHeader       title row with a close button (default true)
 *           showBackdrop     dim layer behind the panel (default true;
 *                            fullscreen never has one)
 *           closeOnBackdropPress (default true). The Android back button
 *                            always calls onClose.
 *           drawerSide       left (default) | right   (drawer only)
 *           drawerWidth      percent of the screen width, 10 to 100
 *                            (default 80; drawer only)
 *           contentPadding   padding around children (default spacing.md)
 *           style            extra style for the panel
 * Toasts   it mounts a <ToastHost />, so toasts show above the modal.
 * ─────────────────────────────────────────────────────────────
 */
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ToastHost } from "@/components/ui/toast";
import { usePresence } from "@/hooks/core/usePresence";
import { OVERLAY_COLOR, useTheme } from "@/theme";
import React from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal as RNModal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ModalVariant = "center" | "sheet" | "fullscreen" | "drawer";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  variant?: ModalVariant;
  drawerSide?: "left" | "right";
  /** Percent of the screen width the drawer covers. Default 80. */
  drawerWidth?: number;
  title?: string;
  showHeader?: boolean;
  showBackdrop?: boolean;
  closeOnBackdropPress?: boolean;
  contentPadding?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Modal({
  visible,
  onClose,
  variant = "center",
  drawerSide = "left",
  drawerWidth = 80,
  title,
  showHeader = true,
  showBackdrop = true,
  closeOnBackdropPress = true,
  contentPadding,
  style,
  children,
}: ModalProps) {
  const { theme, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const { mounted, progress } = usePresence(
    visible,
    variant === "sheet" || variant === "drawer" ? 260 : 200,
  );

  if (!mounted) return null;

  const fullscreen = variant === "fullscreen";
  const sheet = variant === "sheet";
  const drawer = variant === "drawer";
  const percent = Math.min(Math.max(drawerWidth, 10), 100);
  const drawerPx = (win.width * percent) / 100;

  const motion =
    variant === "center"
      ? {
          opacity: progress,
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
              }),
            },
          ],
        }
      : sheet
        ? {
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [win.height, 0],
                }),
              },
            ],
          }
        : drawer
          ? {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      drawerSide === "left" ? -drawerPx : drawerPx,
                      0,
                    ],
                  }),
                },
              ],
            }
          : {
            opacity: progress,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          };

  const panel: ViewStyle = fullscreen
    ? {
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
    : drawer
      ? {
          width: `${percent}%`,
          backgroundColor: theme.surface,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          borderColor: theme.border,
          ...(drawerSide === "left"
            ? { borderRightWidth: 1 }
            : { borderLeftWidth: 1 }),
        }
      : sheet
      ? {
          maxHeight: win.height * 0.9,
          backgroundColor: theme.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingBottom: insets.bottom,
        }
      : {
          width: "100%",
          maxWidth: 480,
          maxHeight: win.height * 0.85,
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.border,
        };

  return (
    <RNModal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        {showBackdrop && !fullscreen ? (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: OVERLAY_COLOR, opacity: progress },
            ]}
          />
        ) : null}
        <Pressable
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdropPress && !fullscreen ? onClose : undefined}
        />

        <KeyboardAvoidingView
          behavior="padding"
          style={{
            flex: 1,
            flexDirection: drawer ? "row" : "column",
            justifyContent: drawer
              ? drawerSide === "left"
                ? "flex-start"
                : "flex-end"
              : sheet
                ? "flex-end"
                : "center",
            alignItems: fullscreen || sheet || drawer ? "stretch" : "center",
            padding: variant === "center" ? spacing.lg : 0,
            pointerEvents: "box-none",
          }}
        >
          <Animated.View style={[panel, motion, style]}>
            {sheet ? (
              <View
                style={{
                  alignSelf: "center",
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  marginTop: spacing.sm,
                  backgroundColor: theme.borderStrong,
                }}
              />
            ) : null}

            {showHeader ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }}
              >
                <Text size="lg" semibold numberOfLines={1} style={{ flex: 1 }}>
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Icon name="close" size={22} color={theme.textSecondary} />
                </Pressable>
              </View>
            ) : null}

            <View
              style={{
                flexShrink: 1,
                flex: fullscreen || drawer ? 1 : undefined,
                padding: contentPadding ?? spacing.md,
              }}
            >
              {children}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        <ToastHost />
      </View>
    </RNModal>
  );
}
