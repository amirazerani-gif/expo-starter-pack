/**
 * components/ui/icon.tsx
 * Ionicons with theme defaults, plus the IconName type used by every
 * component that takes an icon prop (Button, Input, ...).
 *
 *   <Icon name="mail-outline" size={18} />
 */
import { useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import type React from "react";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

type IconProps = {
  name: IconName;
  size?: number;
  /** Defaults to the primary text color. */
  color?: string;
};

export function Icon({ name, size = 18, color }: IconProps) {
  const { theme } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? theme.textPrimary} />;
}
