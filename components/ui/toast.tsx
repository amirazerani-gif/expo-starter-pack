/**
 * components/ui/toast.tsx
 * ─────────────────────────────────────────────────────────────
 * Toasts, callable from anywhere (components, hooks, stores).
 *
 *   toast.success("Saved");
 *   toast.error("Could not save", "Check your connection.");
 *   toast.error("Check your input", "Email is required.", {
 *     details: ["Password is too short"],
 *     meta: "422",
 *     action: { label: "Retry", onPress: save },
 *   });
 *   toast.show({ type: "info", title: "Heads up", duration: 6000 });
 *   toast.dismiss();             // all, or toast.dismiss(id)
 *
 * Mount <ToastHost /> once in the root layout. Modal mounts its own, so
 * toasts also appear above an open modal.
 *
 * Content   title, message, details (extra lines; three shown, then
 *           "+N more"), meta (a small badge, e.g. an HTTP status),
 *           action ({ label, onPress }; it dismisses the toast).
 * Behavior  newest on top, at most 3 visible, tap or swipe sideways to
 *           dismiss, a bar shows the time left, an identical toast already
 *           on screen is not shown twice, duration 0 keeps a toast until it
 *           is dismissed (default 3500 ms).
 * ─────────────────────────────────────────────────────────────
 */
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { typography, useTheme } from "@/theme";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, PanResponder, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";

export type ToastType = "neutral" | "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  /** Extra lines under the message, e.g. the remaining validation errors. */
  details?: string[];
  /** A short badge next to the title, e.g. "422" or "Offline". */
  meta?: string;
  action?: ToastAction;
  /** Milliseconds on screen. 0 keeps it until dismissed. Default 3500. */
  duration?: number;
}

type ToastEntry = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  details?: string[];
  meta?: string;
  action?: ToastAction;
  duration: number;
  leaving: boolean;
};

const MAX_VISIBLE = 3;
const MAX_DETAILS = 3;
const DEFAULT_DURATION = 3500;
let nextId = 1;

type ToastState = {
  toasts: ToastEntry[];
  add: (options: ToastOptions) => number;
  /** Starts the exit animation of one toast, or of all. */
  dismiss: (id?: number) => void;
  /** Removes a toast after its exit animation. */
  remove: (id: number) => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  add: ({
    title,
    message,
    type = "neutral",
    details,
    meta,
    action,
    duration = DEFAULT_DURATION,
  }) => {
    const existing = get().toasts.find(
      (t) =>
        !t.leaving &&
        t.type === type &&
        t.title === title &&
        t.message === message,
    );
    if (existing) return existing.id;

    const id = nextId++;
    set((state) => {
      const next = [
        {
          id,
          type,
          title,
          message,
          details,
          meta,
          action,
          duration,
          leaving: false,
        },
        ...state.toasts,
      ];
      let visible = 0;
      return {
        toasts: next.map((t) =>
          t.leaving || ++visible <= MAX_VISIBLE ? t : { ...t, leaving: true },
        ),
      };
    });
    return id;
  },

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.map((t) =>
        id === undefined || t.id === id ? { ...t, leaving: true } : t,
      ),
    })),

  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

const api = () => useToastStore.getState();

type Extra = Omit<ToastOptions, "title" | "message" | "type">;
const typed =
  (type: ToastType) => (title: string, message?: string, extra?: Extra) =>
    api().add({ ...extra, type, title, message });

export const toast = {
  show: (options: ToastOptions) => api().add(options),
  success: typed("success"),
  error: typed("error"),
  warning: typed("warning"),
  info: typed("info"),
  dismiss: (id?: number) => api().dismiss(id),
};

const ICONS: Record<ToastType, IconName> = {
  neutral: "notifications-outline",
  success: "checkmark-circle",
  error: "alert-circle",
  warning: "warning",
  info: "information-circle",
};

const SWIPE_DISTANCE = 80;

function ToastItem({ item }: { item: ToastEntry }) {
  const { theme, radius, spacing } = useTheme();
  const progress = useRef(new Animated.Value(0)).current; // enter and exit
  const life = useRef(new Animated.Value(1)).current; // time left
  const pan = useRef(new Animated.Value(0)).current; // sideways swipe

  const color: Record<ToastType, string> = {
    neutral: theme.textSecondary,
    success: theme.success,
    error: theme.error,
    warning: theme.warning,
    info: theme.info,
  };
  const tone = color[item.type];
  const dismiss = () => useToastStore.getState().dismiss(item.id);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (!item.leaving) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) useToastStore.getState().remove(item.id);
    });
  }, [item.leaving, item.id, progress]);

  // The countdown bar and the auto-dismiss are the same animation.
  useEffect(() => {
    if (item.duration <= 0) return;
    const countdown = Animated.timing(life, {
      toValue: 0,
      duration: item.duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    countdown.start(({ finished }) => {
      if (finished) useToastStore.getState().dismiss(item.id);
    });
    return () => countdown.stop();
  }, [item.id, item.duration, life]);

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: Animated.event([null, { dx: pan }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_e, g) => {
        if (Math.abs(g.dx) > SWIPE_DISTANCE || Math.abs(g.vx) > 0.8) {
          useToastStore.getState().dismiss(item.id);
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, { toValue: 0, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const details = item.details ?? [];
  const hidden = details.length - MAX_DETAILS;

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-12, 0],
            }),
          },
        ],
      }}
    >
      <Animated.View
        {...swipe.panHandlers}
        style={{
          transform: [{ translateX: pan }],
          opacity: pan.interpolate({
            inputRange: [-200, 0, 200],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          }),
        }}
      >
        <Pressable
          onPress={dismiss}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{
            flexDirection: "row",
            overflow: "hidden",
            borderRadius: radius.md,
            borderLeftWidth: 3,
            borderLeftColor: tone,
            backgroundColor: theme.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
          }}
        >

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              gap: spacing.sm,
              padding: spacing.sm + 2,
            }}
          >
            <Icon name={ICONS[item.type]} size={20} color={tone} />

            <View style={{ flex: 1, gap: 2 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Text size="sm" medium numberOfLines={2} style={{ flex: 1 }}>
                  {item.title}
                </Text>
                {item.meta ? (
                  <Badge
                    label={item.meta}
                    size="sm"
                    tone={item.type as BadgeTone}
                  />
                ) : null}
                <Pressable
                  onPress={dismiss}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss"
                >
                  <Icon name="close" size={16} color={theme.textTertiary} />
                </Pressable>
              </View>

              {item.message ? (
                <Text size="xs" dim>
                  {item.message}
                </Text>
              ) : null}

              {details.slice(0, MAX_DETAILS).map((line, i) => (
                <Text key={i} size="xs" dim>
                  {"• "}
                  {line}
                </Text>
              ))}
              {hidden > 0 ? (
                <Text size="xs" dim>
                  {`+${hidden} more`}
                </Text>
              ) : null}

              {item.action ? (
                <Pressable
                  onPress={() => {
                    item.action?.onPress();
                    dismiss();
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  style={{ alignSelf: "flex-start", marginTop: spacing.xs }}
                >
                  <Text
                    size="xs"
                    weight={typography.controlWeight}
                    style={{ color: tone }}
                  >
                    {item.action.label}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {item.duration > 0 ? (
            <Animated.View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 2,
                backgroundColor: tone,
                opacity: 0.35,
                transformOrigin: "left center",
                transform: [{ scaleX: life }],
              }}
            />
          ) : null}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top + spacing.sm,
        left: spacing.md,
        right: spacing.md,
        gap: spacing.sm,
        zIndex: 1000,
        elevation: 1000,
        pointerEvents: "box-none",
      }}
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} />
      ))}
    </View>
  );
}
