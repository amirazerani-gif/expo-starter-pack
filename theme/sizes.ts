/**
 * theme/sizes.ts
 * ─────────────────────────────────────────────────────────────
 * One size scale shared by every control (Button, Input, TextArea,
 * and any control you add). A `md` Button and a `md` Input are the
 * same height. Edit the numbers here to resize the whole kit.
 *
 *   const m = controlMetrics("md");   // scaled height, padding, icon, gap
 * ─────────────────────────────────────────────────────────────
 */
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

export type ControlSize = "sm" | "md" | "lg";

/** Unscaled design values. Scaling is applied in controlMetrics(). */
const SPEC = {
  sm: { height: 25, font: "xs", paddingX: 10, icon: 14, gap: 6 },
  md: { height: 30, font: "sm", paddingX: 14, icon: 16, gap: 8 },
  lg: { height: 35, font: "md", paddingX: 16, icon: 18, gap: 8 },
} as const;

/** Border width of every outlined control. */
export const CONTROL_BORDER = 1;
/** Opacity of a disabled control. */
export const DISABLED_OPACITY = 0.5;
/** Opacity of a pressed control. */
export const PRESSED_OPACITY = 0.8;
/** Platform minimum touch target; controls extend their hit area to it. */
const MIN_TOUCH = 44;

export function controlMetrics(size: ControlSize = "md") {
  const spec = SPEC[size];
  const height = verticalScale(spec.height);
  const slop = Math.max(0, Math.ceil((MIN_TOUCH - height) / 2));
  return {
    height,
    /** A `Text` size key, so labels use the same type scale as everything else. */
    font: spec.font,
    paddingX: scale(spec.paddingX),
    icon: moderateScale(spec.icon),
    gap: moderateScale(spec.gap),
    hitSlop: { top: slop, bottom: slop, left: 0, right: 0 },
  };
}
