/**
 * components/navigation/avatar.tsx
 * Circular avatar showing a person's initials. Swap the initials for an
 * <Image> once your API returns an avatar URL.
 *
 *   <Avatar name="Ada Lovelace" size={36} />
 */
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme";
import { View } from "react-native";

type AvatarProps = {
  name?: string | null;
  size?: number;
};

function initialsOf(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Avatar({ name, size = 36 }: AvatarProps) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text inverse medium style={{ fontSize: size * 0.4 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
