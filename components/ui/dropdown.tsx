/**
 * components/ui/dropdown.tsx
 * ─────────────────────────────────────────────────────────────
 * A panel that opens under (or over) a trigger. The panel content is
 * yours: rows, a list, a form. Build a select, a menu or a picker from it.
 *
 *   <Dropdown label="Sort by">
 *     <DropdownItem label="Newest" selected onPress={...} />
 *     <DropdownItem label="Oldest" onPress={...} />
 *   </Dropdown>
 *
 *   <Dropdown trigger={({ open, toggle }) => <MyButton onPress={toggle} />}>
 *     {(close) => <MyContent onDone={close} />}
 *   </Dropdown>
 *
 * Trigger   label (+ leftIcon, size, fullWidth) renders the default
 *           control; `trigger` replaces it. triggerStyle styles the default.
 * Panel     align (left | right of the trigger, default left),
 *           panelWidth (number, or "trigger" to match the trigger),
 *           maxHeight (default 320, scrolls beyond it), placement
 *           (auto | bottom | top; auto flips when there is no room),
 *           panelStyle.
 * Behavior  closeOnBackdropPress (default true), disabled, onOpenChange.
 *           It closes when the window size changes (rotation).
 * Children  a node, or (close) => node. DropdownItem closes the panel on
 *           press by default; useDropdown() gives custom rows the close fn.
 * ─────────────────────────────────────────────────────────────
 */
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { usePresence } from "@/hooks/core/usePresence";
import {
  CONTROL_BORDER,
  controlMetrics,
  DISABLED_OPACITY,
  PRESSED_OPACITY,
  typography,
  useTheme,
  type ControlSize,
} from "@/theme";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GAP = 6;
const MARGIN = 8;
const DEFAULT_MAX_HEIGHT = 320;

type Anchor = { x: number; y: number; width: number; height: number };
type Box = { w: number; h: number };

const DropdownContext = createContext<{ close: () => void } | null>(null);

/** Gives custom rows inside a Dropdown the function that closes it. */
export function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("useDropdown must be used inside a <Dropdown>");
  return ctx;
}

export interface DropdownProps {
  label?: string;
  leftIcon?: IconName;
  size?: ControlSize;
  fullWidth?: boolean;
  trigger?: (state: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "left" | "right";
  panelWidth?: number | "trigger";
  maxHeight?: number;
  placement?: "auto" | "bottom" | "top";
  closeOnBackdropPress?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerStyle?: StyleProp<ViewStyle>;
  panelStyle?: StyleProp<ViewStyle>;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export function Dropdown({
  label,
  leftIcon,
  size = "md",
  fullWidth = false,
  trigger,
  children,
  align = "left",
  panelWidth,
  maxHeight = DEFAULT_MAX_HEIGHT,
  placement = "auto",
  closeOnBackdropPress = true,
  disabled = false,
  onOpenChange,
  triggerStyle,
  panelStyle,
}: DropdownProps) {
  const { theme, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const m = controlMetrics(size);

  const triggerRef = useRef<React.ComponentRef<typeof View>>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [contentH, setContentH] = useState<number | null>(null);
  const { mounted, progress } = usePresence(open, 160);

  const close = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const openPanel = () => {
    if (disabled) return;
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
      onOpenChange?.(true);
    });
  };

  const toggle = () => (open ? close() : openPanel());

  // A rotation or resize invalidates the measured anchor.
  const lastWin = useRef(win);
  useEffect(() => {
    const prev = lastWin.current;
    lastWin.current = win;
    if (open && (prev.width !== win.width || prev.height !== win.height)) {
      close();
    }
  }, [win, open, close]);

  // Forget the previous measurements once the panel is gone.
  useEffect(() => {
    if (!mounted) {
      setBox(null);
      setContentH(null);
    }
  }, [mounted]);

  // ── Placement ───────────────────────────────────────────────
  let position: ViewStyle = {};
  let below = true;
  let panelMaxHeight = maxHeight;
  if (anchor) {
    const natural = Math.min(contentH ?? maxHeight, maxHeight);
    const spaceBelow =
      win.height - (anchor.y + anchor.height) - insets.bottom - MARGIN - GAP;
    const spaceAbove = anchor.y - insets.top - MARGIN - GAP;

    below =
      placement === "bottom"
        ? true
        : placement === "top"
          ? false
          : spaceBelow >= natural || spaceBelow >= spaceAbove;

    panelMaxHeight = Math.min(
      maxHeight,
      Math.max(below ? spaceBelow : spaceAbove, 0),
    );

    const w = box?.w ?? 0;
    const h = box?.h ?? natural;
    const preferredLeft =
      align === "right" ? anchor.x + anchor.width - w : anchor.x;
    position = {
      left: clamp(preferredLeft, MARGIN, Math.max(MARGIN, win.width - MARGIN - w)),
      top: below ? anchor.y + anchor.height + GAP : anchor.y - GAP - h,
    };
  }

  const widthStyle: ViewStyle = anchor
    ? panelWidth === "trigger"
      ? { width: anchor.width }
      : panelWidth !== undefined
        ? { width: panelWidth }
        : { minWidth: Math.max(anchor.width, 180) }
    : {};

  return (
    <>
      <View
        ref={triggerRef}
        collapsable={false}
        style={{ alignSelf: fullWidth ? "stretch" : "flex-start" }}
      >
        {trigger ? (
          trigger({ open, toggle })
        ) : (
          <Pressable
            onPress={toggle}
            disabled={disabled}
            hitSlop={m.hitSlop}
            accessibilityRole="button"
            accessibilityState={{ expanded: open, disabled }}
            style={({ pressed }) => [
              {
                height: m.height,
                flexDirection: "row",
                alignItems: "center",
                gap: m.gap,
                paddingHorizontal: m.paddingX,
                borderRadius: radius.sm,
                borderWidth: CONTROL_BORDER,
                borderColor: open ? theme.primary : theme.border,
                backgroundColor: theme.surface,
                opacity: disabled
                  ? DISABLED_OPACITY
                  : pressed
                    ? PRESSED_OPACITY
                    : 1,
              },
              triggerStyle,
            ]}
          >
            {leftIcon ? (
              <Icon name={leftIcon} size={m.icon} color={theme.textSecondary} />
            ) : null}
            {label ? (
              <Text
                size={m.font}
                weight={typography.controlWeight}
                style={{ flexShrink: 1 }}
                numberOfLines={1}
              >
                {label}
              </Text>
            ) : null}
            <Icon
              name={open ? "chevron-up" : "chevron-down"}
              size={m.icon}
              color={theme.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {mounted && anchor ? (
        <RNModal
          visible
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={close}
        >
          <View style={{ flex: 1 }}>
            <Pressable
              accessible={false}
              style={StyleSheet.absoluteFill}
              onPress={closeOnBackdropPress ? close : undefined}
            />
            <Animated.View
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setBox((prev) =>
                  prev && prev.w === width && prev.h === height
                    ? prev
                    : { w: width, h: height },
                );
              }}
              style={[
                {
                  position: "absolute",
                  maxWidth: win.width - MARGIN * 2,
                  maxHeight: panelMaxHeight,
                  backgroundColor: theme.surface,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.12,
                  shadowRadius: 16,
                  elevation: 12,
                },
                widthStyle,
                position,
                panelStyle,
                {
                  // Hidden until measured, so it never flashes in the wrong place.
                  opacity: box ? progress : 0,
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [below ? -6 : 6, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <DropdownContext.Provider value={{ close }}>
                <ScrollView
                  style={{ flexGrow: 0 }}
                  contentContainerStyle={{ paddingVertical: spacing.xs }}
                  onContentSizeChange={(_w, h) => setContentH(h)}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  {typeof children === "function" ? children(close) : children}
                </ScrollView>
              </DropdownContext.Provider>
            </Animated.View>
          </View>
        </RNModal>
      ) : null}
    </>
  );
}

// ─── DropdownItem ───────────────────────────────────────────────
export interface DropdownItemProps {
  label: string;
  icon?: IconName;
  /** Shows a check mark and the primary color. */
  selected?: boolean;
  /** Error color, for actions like Delete. */
  destructive?: boolean;
  disabled?: boolean;
  /** Keep the panel open after the press. Default: it closes. */
  keepOpen?: boolean;
  onPress?: () => void;
}

export function DropdownItem({
  label,
  icon,
  selected = false,
  destructive = false,
  disabled = false,
  keepOpen = false,
  onPress,
}: DropdownItemProps) {
  const { theme, spacing } = useTheme();
  const ctx = useContext(DropdownContext);
  const color = destructive
    ? theme.error
    : selected
      ? theme.primary
      : theme.textPrimary;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        onPress?.();
        if (!keepOpen) ctx?.close();
      }}
      accessibilityRole="menuitem"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: pressed ? theme.backgroundSecondary : "transparent",
        opacity: disabled ? DISABLED_OPACITY : 1,
      })}
    >
      {icon ? <Icon name={icon} size={18} color={color} /> : null}
      <Text
        size="sm"
        weight={selected ? typography.controlWeight : undefined}
        style={{ flex: 1, color }}
      >
        {label}
      </Text>
      {selected ? <Icon name="checkmark" size={18} color={color} /> : null}
    </Pressable>
  );
}
