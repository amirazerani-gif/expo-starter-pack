/**
 * theme/typography.ts
 * ─────────────────────────────────────────────────────────────
 * The app's global font setup. Text, Button, Input and TextArea all read
 * from here, so this is the one place to change fonts.
 *
 *   appFonts      the font files loaded at boot (useFonts in app/_layout.tsx)
 *   fontFamilies  named families, each with a font per weight
 *   typography    the default family and weights, the size scale
 *
 * Changing the font:
 *   1. import your font's weights and list them in `appFonts`
 *   2. point a family's weights in `fontFamilies` at the matching keys
 *      (or at a system font name such as "System", which needs no loading)
 *
 * Using several families:
 *   add another entry to `fontFamilies` (for example `heading`), load its
 *   files in `appFonts`, and set `typography.defaultFamily` to the one that
 *   should apply everywhere by default. Pick another per element with
 *   <Text family="heading">.
 *
 * Text color is not set here: it lives in the theme tokens (tokens.ts).
 * ─────────────────────────────────────────────────────────────
 */
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { moderateScale } from "react-native-size-matters";

/** Font files to load before the app renders. Keys are the family names. */
export const appFonts = {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} as const;

/** The weights a component can ask for. Each maps to a font in a family. */
export type FontWeight = "regular" | "medium" | "semibold" | "bold";

/** Named font families, each with one font per weight. */
export const fontFamilies = {
  main: {
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semibold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
  },
} satisfies Record<string, Record<FontWeight, string>>;

export type FontFamily = keyof typeof fontFamilies;

export const typography = {
  /** The family used wherever none is chosen. */
  defaultFamily: "main" as FontFamily,

  /** Weight of body text and inputs. */
  defaultWeight: "regular" as FontWeight,
  /** Weight of Button labels. */
  controlWeight: "medium" as FontWeight,
  /** Weight of the label above a form field. */
  labelWeight: "medium" as FontWeight,

  /** Font sizes by name, before device scaling. */
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  /** Line height as a multiple of the font size. */
  lineHeight: 1.45,
  /** How strongly sizes grow on larger screens (moderateScale factor). */
  sizeScaleFactor: 0.3,
};

export type TextSize = keyof typeof typography.sizes;

/** The font for a weight in a family. Both default to the configured defaults. */
export const fontFamilyOf = (weight?: FontWeight, family?: FontFamily) =>
  fontFamilies[family ?? typography.defaultFamily][
    weight ?? typography.defaultWeight
  ];

/** The device-scaled pixel size for a size name. */
export const scaledFont = (size: TextSize) =>
  moderateScale(typography.sizes[size], typography.sizeScaleFactor);
