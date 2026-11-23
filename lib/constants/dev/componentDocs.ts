/**
 * lib/constants/dev/componentDocs.ts
 * The documentation text of every UI kit entry on the Home screen: title,
 * import line, description and signature. The live examples live in
 * components/dev/componentDemos.tsx, keyed by the same `id`.
 * Example-only: safe to delete with the rest of lib/constants/dev.
 *
 * To document a new component: add an entry here, and a demo with the same
 * id in components/dev/componentDemos.tsx.
 */
import type { ComponentDoc } from "@/components/dev/docSection";

export const COMPONENT_DOCS: ComponentDoc[] = [
  // ─── Foundations ──────────────────────────────────────────────
  {
    id: "theme",
    group: "foundations",
    title: "Theme",
    import: 'import { useTheme } from "@/theme";',
    description:
      "Colors, radius and spacing are tokens in theme/tokens.ts, with a light and a dark set chosen by the device. Read them with useTheme() and never hard-code a color in a screen. Edit the tokens to rebrand the whole app.",
    signature: `const { theme, isDark, radius, spacing } = useTheme();

theme.primary  secondary  success  warning  error  info
theme.background  surface  border  textPrimary  textSecondary
radius   xs 6 · sm 10 · md 14 · lg 20 · xl 28 · full
spacing  xs 4 · sm 8 · md 16 · lg 24 · xl 32 · xxl 48`,
  },
  {
    id: "text",
    group: "foundations",
    title: "Text and typography",
    import: 'import { Text } from "@/components/ui/text";',
    description:
      "The only text component. Font family, weights and sizes come from theme/typography.ts and the color from the theme, so changing the font once changes every component. You can define several families and pick one per element.",
    signature: `<Text
  size?:   "xs" | "sm" | "md" | "lg" | "xl" | "xxl"     // default "md"
  weight?: "regular" | "medium" | "semibold" | "bold"
  family?: a key of fontFamilies                       // default family
  medium? semibold? bold?                              // weight shortcuts
  dim?     inverse?                                    // secondary / on primary
  style?                                               // color, fontSize override
/>`,
  },
  {
    id: "sizes",
    group: "foundations",
    title: "Control sizes",
    import: 'import { controlMetrics, CONTROL_BORDER } from "@/theme";',
    description:
      "Every control (Button, Input, TextArea, Chip, Checkbox, RadioGroup) shares one size scale from theme/sizes.ts, so a md Button and a md Input are the same height. Heights are 25, 30 and 35, and each control extends its touch area to 44. Edit the numbers once to resize the kit.",
    signature: `size?: "sm" | "md" | "lg"                  // default "md"

controlMetrics(size) -> { height, font, paddingX, icon, gap, hitSlop }
CONTROL_BORDER 1 · DISABLED_OPACITY 0.5 · PRESSED_OPACITY 0.8`,
  },

  // ─── Controls ─────────────────────────────────────────────────
  {
    id: "button",
    group: "controls",
    title: "Button",
    import: 'import { Button } from "@/components/ui/button";',
    description:
      "Solid by default: a primary background with a white label. The label weight comes from typography.controlWeight. Icons are Ionicons names, sized and colored by the button. While loading it is disabled and shows a spinner.",
    signature: `<Button
  title: string
  onPress: () => void
  variant?: "solid" | "outline" | "ghost" | "gradient"   // default "solid"
  size?:    "sm" | "md" | "lg"                           // default "md"
  loading? loadingTitle? disabled?
  fullWidth?: boolean                                    // default true
  leftIcon? rightIcon?: IconName
  labelColor? gradientColors? style?
/>`,
  },
  {
    id: "input",
    group: "controls",
    title: "Input",
    import: 'import { Input } from "@/components/ui/input";',
    description:
      "A single-line input with its label, hint and error in one wrapper. The border follows the state: default, primary while focused, error when invalid. It forwards its ref and accepts every TextInput prop.",
    signature: `<Input
  label? hint? error?: string
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  leftIcon? rightIcon?: IconName
  onRightIconPress?: () => void
  showPasswordToggle?: boolean
  containerStyle?
  ...TextInputProps
/>`,
  },
  {
    id: "textArea",
    group: "controls",
    title: "TextArea",
    import: 'import { TextArea } from "@/components/ui/textArea";',
    description:
      "The same look and props as Input, for several lines. rows sets the minimum height and the box grows with the content.",
    signature: `<TextArea
  label? hint? error?: string
  size? disabled?
  rows?: number                              // default 4
  containerStyle?
  ...TextInputProps
/>`,
  },
  {
    id: "switch",
    group: "controls",
    title: "Switch",
    import: 'import { Switch } from "@/components/ui/switch";',
    description:
      "The native switch with theme colors. With a label the whole row is the touch target. The switch keeps the platform's own size.",
    signature: `<Switch
  value: boolean
  onValueChange: (value: boolean) => void
  label? hint? error?: string
  disabled? style?
/>`,
  },
  {
    id: "checkbox",
    group: "controls",
    title: "Checkbox",
    import: 'import { Checkbox } from "@/components/ui/checkbox";',
    description:
      "A box with an optional label, hint and error. The whole row is the touch target. indeterminate shows a dash for a partial selection.",
    signature: `<Checkbox
  checked: boolean
  onChange: (checked: boolean) => void
  label? hint? error?: string
  indeterminate? disabled?
  size?: "sm" | "md" | "lg"
  style?
/>`,
  },
  {
    id: "radioGroup",
    group: "controls",
    title: "RadioGroup",
    import: 'import { RadioGroup } from "@/components/ui/radioGroup";',
    description:
      "One choice from a short list. Option values can be strings or numbers, and onChange receives the option's own type.",
    signature: `<RadioGroup<T extends string | number>
  options: { label, value: T, hint?, disabled? }[]
  value: T | null | undefined
  onChange: (value: T) => void
  label? hint? error?: string
  direction?: "vertical" | "horizontal"      // default "vertical"
  size? disabled? containerStyle?
/>`,
  },
  {
    id: "chip",
    group: "controls",
    title: "Chip",
    import: 'import { Chip } from "@/components/ui/chip";',
    description:
      "A pill for filters, tags and choices. It can be pressed, shown as selected, and removed. A chip without onPress is just a label.",
    signature: `<Chip
  label: string
  selected? disabled?
  onPress?: () => void
  onRemove?: () => void                      // shows a close icon
  leftIcon?: IconName
  size?: "sm" | "md" | "lg"
  style?
/>`,
  },

  // ─── Display ──────────────────────────────────────────────────
  {
    id: "card",
    group: "display",
    title: "Card",
    import: 'import { Card } from "@/components/ui/card";',
    description:
      "A bordered surface that groups content. Use bg for another color, gradient for a gradient, and bordered={false} to remove the border.",
    signature: `<Card
  bg?: string                                // default theme.surface
  gradient?: [string, string, ...string[]]
  gradientStart? gradientEnd?: { x, y }
  bordered?: boolean                         // default true
  padding?: number                           // default spacing.md
  style?
  ...ViewProps
/>`,
  },
  {
    id: "icon",
    group: "display",
    title: "Icon",
    import: 'import { Icon, type IconName } from "@/components/ui/icon";',
    description:
      "An Ionicons glyph with theme defaults. IconName is the type every icon prop in the kit accepts.",
    signature: `<Icon
  name: IconName
  size?: number                              // default 18
  color?: string                             // default theme.textPrimary
/>`,
  },
  {
    id: "badge",
    group: "display",
    title: "Badge",
    import: 'import { Badge } from "@/components/ui/badge";',
    description:
      "A small non-interactive label, count or dot. A badge is an indicator, so it has its own compact size scale. A count above max shows as max+.",
    signature: `<Badge
  label?: string
  count?: number   max?: number              // default 99
  dot?: boolean                              // a circle, no text
  leftIcon?: IconName
  tone?:    "neutral" | "primary" | "success" | "warning" | "error" | "info"
  variant?: "soft" | "solid" | "outline"     // default "soft"
  size?:    "sm" | "md" | "lg"
  style?
/>`,
  },
  {
    id: "avatar",
    group: "display",
    title: "Avatar",
    import: 'import { Avatar } from "@/components/ui/avatar";',
    description:
      "A circular picture of a person. If the image is missing or fails to load it shows the initials. The status dot is optional.",
    signature: `<Avatar
  name?: string | null                       // for the initials
  uri?: string | null                        // the image
  size?: "sm" | "md" | "lg" | "xl" | number  // 28 36 48 64, default "md"
  status?: "online" | "away" | "busy" | "offline"
  style?
/>`,
  },

  // ─── Overlays ─────────────────────────────────────────────────
  {
    id: "dropdown",
    group: "overlays",
    title: "Dropdown",
    import:
      'import { Dropdown, DropdownItem, useDropdown } from "@/components/ui/dropdown";',
    description:
      "A panel that opens under, or over, a trigger. What goes inside is yours: rows, a list, a form. It flips upward when there is no room below, scrolls past maxHeight and closes on rotation. A select is a Dropdown with rows.",
    signature: `<Dropdown
  label? leftIcon? size? fullWidth? triggerStyle?   // the default trigger
  trigger?: ({ open, toggle }) => ReactNode         // or your own
  align?: "left" | "right"                          // default "left"
  panelWidth?: number | "trigger"
  maxHeight?: number                                // default 320
  placement?: "auto" | "bottom" | "top"
  closeOnBackdropPress? disabled? onOpenChange? panelStyle?
>
  {node | (close) => node}
</Dropdown>

<DropdownItem label icon? selected? destructive? disabled?
              keepOpen? onPress? />                 // closes the panel by default
useDropdown() -> { close }                          // for custom rows`,
  },
  {
    id: "modal",
    group: "overlays",
    title: "Modal",
    import: 'import { Modal } from "@/components/ui/modal";',
    description:
      "An overlay with four layouts. It adds only an optional header with a close button and an optional backdrop; everything inside is yours. Toasts show above it, and the Android back button closes it.",
    signature: `<Modal
  visible: boolean
  onClose: () => void
  variant?: "center" | "sheet" | "fullscreen" | "drawer"   // default "center"
  drawerSide?: "left" | "right"                            // drawer only
  drawerWidth?: number                                     // percent, default 80
  title?: string
  showHeader?: boolean                                     // default true
  showBackdrop?: boolean                                   // default true
  closeOnBackdropPress?: boolean                           // default true
  contentPadding?: number                                  // default spacing.md
  style?
>
  {children}
</Modal>`,
  },
  {
    id: "toast",
    group: "overlays",
    title: "Toast",
    import: 'import { toast, ToastHost } from "@/components/ui/toast";',
    description:
      "Compact toasts callable from anywhere, not only components. <ToastHost /> is mounted once in the root layout, and the global error handler uses the same toasts. Tap or swipe to dismiss; identical toasts are not shown twice.",
    signature: `toast.success(title, message?, extra?)
toast.error(title, message?, extra?)
toast.warning(title, message?, extra?)
toast.info(title, message?, extra?)
toast.show({ title, message?, type?, ...extra })
toast.dismiss(id?)

extra: {
  details?: string[]                         // more lines, three shown
  meta?: string                              // a badge, e.g. "422"
  action?: { label, onPress }
  duration?: number                          // ms, default 3500, 0 = sticky
}`,
  },
];
