/**
 * components/ui/avatar.tsx
 * ─────────────────────────────────────────────────────────────
 * A circular picture of a person, with initials as the fallback.
 *
 *   <Avatar name="Ada Lovelace" />
 *   <Avatar name="Ada Lovelace" uri={user.avatarUrl} size="lg" status="online" />
 *   <Avatar name="Ada" size={32} />
 *
 * Props   name (initials fallback), uri (image; falls back to initials if
 *         missing or it fails to load), size (sm 28 | md 36 | lg 48 | xl 64,
 *         or any number; default md), status (online | away | busy |
 *         offline, shown as a dot), style.
 * ─────────────────────────────────────────────────────────────
 */
import { Text } from "@/components/ui/text";
import { palette, useTheme } from "@/theme";
import React, { useEffect, useState } from "react";
import { Image, View, type StyleProp, type ViewStyle } from "react-native";

const SIZES = { sm: 28, md: 36, lg: 48, xl: 64 } as const;

export type AvatarSize = keyof typeof SIZES | number;
export type AvatarStatus = "online" | "away" | "busy" | "offline";

export interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: AvatarSize;
  status?: AvatarStatus;
  style?: StyleProp<ViewStyle>;
}

function initialsOf(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Avatar({
  name,
  uri,
  size = "md",
  status,
  style,
}: AvatarProps) {
  const { theme } = useTheme();
  const px = typeof size === "number" ? size : SIZES[size];
  const [failed, setFailed] = useState(false);

  // A new image gets a fresh chance to load.
  useEffect(() => setFailed(false), [uri]);

  const showImage = !!uri && !failed;
  const dot = Math.max(8, Math.round(px * 0.28));
  const statusColor = {
    online: theme.success,
    away: theme.warning,
    busy: theme.error,
    offline: theme.textTertiary,
  };

  return (
    <View style={[{ width: px, height: px }, style]}>
      <View
        style={{
          width: px,
          height: px,
          borderRadius: px / 2,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.primary,
        }}
      >
        {showImage ? (
          <Image
            source={{ uri }}
            onError={() => setFailed(true)}
            style={{ width: px, height: px }}
            accessibilityLabel={name ?? undefined}
          />
        ) : (
          <Text semibold style={{ fontSize: px * 0.4, color: palette.white }}>
            {initialsOf(name)}
          </Text>
        )}
      </View>
      {status ? (
        <View
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: statusColor[status],
            borderWidth: 2,
            borderColor: theme.background,
          }}
        />
      ) : null}
    </View>
  );
}
