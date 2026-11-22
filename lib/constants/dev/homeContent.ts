/**
 * lib/constants/dev/homeContent.ts
 * All the text of the Home screen outside the component docs. Edit the
 * strings here; the screen only lays them out. Example-only: safe to delete
 * with the rest of lib/constants/dev.
 */
import type { IconName } from "@/components/ui/icon";

export const HERO = {
  title: "Expo Starter Pack",
  tagline:
    "A production-ready Expo template: tabs, an auth-gated dashboard, a typed data layer and a themed UI kit, running end to end before you have a server.",
  tags: [
    "Expo SDK 58",
    "Expo Router",
    "TanStack Query",
    "OpenAPI",
    "TypeScript",
  ],
};

export const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "cloud-outline",
    title: "Typed networking",
    text: "One openapi-fetch client typed from your OpenAPI spec, with query hooks and cache keys derived from it. No hand-written API types.",
  },
  {
    icon: "lock-closed-outline",
    title: "Auth and guards",
    text: "A token store persisted in SecureStore, a guarded dashboard group, and automatic sign-out when a token expires.",
  },
  {
    icon: "alert-circle-outline",
    title: "Global error handling",
    text: "One ApiError type, one error store and toasts, with per-request flags when a screen shows the error inline.",
  },
  {
    icon: "navigate-outline",
    title: "Navigation shell",
    text: "A floating tab bar with a menu panel, and a header with an account entry for guests and signed-in users.",
  },
  {
    icon: "color-palette-outline",
    title: "Themed UI kit",
    text: "Components on one size scale with light and dark mode, one place to set the font, and live examples further down this page.",
  },
  {
    icon: "server-outline",
    title: "Mock backend",
    text: "npm run mock serves the demo contract, so the login, items and profile work immediately.",
  },
];

export const QUICK_START: { title: string; text: string; code?: string }[] = [
  {
    title: "Create your app",
    text: "Scaffold a project from the template.",
    code: "npx create-expo-app my-app --template expo-starter-pack",
  },
  {
    title: "Point it at the mock",
    text: "Copy the environment file, then set EXPO_PUBLIC_API_DEV_URL to http://<your-LAN-IP>:4010 so a physical phone can reach the mock. Emulators use their own host address.",
    code: "cd my-app\ncp .env.example .env\nnpm install",
  },
  {
    title: "Run the mock and the app",
    text: "Two terminals: the mock API on port 4010, then the app.",
    code: "npm run mock\nnpx expo start",
  },
  {
    title: "Sign in",
    text: "Any non-empty email and password work against the mock. You land on the demo dashboard.",
  },
];

export const QUICK_START_NOTE =
  "The mock returns canned data and stores nothing, so created or edited items are not saved. It exists to show the architecture working.";

export const STRUCTURE = `app/               routes only: layouts, guards, thin route files
  (tabs)/          the public tabs: Home and Data (thin route files)
  (auth)/          login
  (dashboard)/     the signed-in area, guarded by _layout.tsx
    dev/           the demo mini app (example only)
screens/
  dev/             the Home, Data and dashboard screens (example only)
components/
  ui/              the UI kit
  navigation/      tab bar, header, drawer content
  dev/             the guide's building blocks and examples (example only)
theme/             tokens, sizes, typography, useTheme()
api/               client, ApiError, types, pagination, generated schema
hooks/
  core/            error toasts, usePresence
  resources/       one *.r.ts file per API resource
stores/            auth and error stores
lib/
  constants/dev/   the guide's text (example only)
  queryClient.ts   the query client and its wiring
openapi/           the demo contract served by the mock
scripts/           gen-api.mjs, strip-example.mjs`;

export const CUSTOMIZE: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "brush-outline",
    title: "Rebrand",
    text: "Edit the colors, radius and spacing in theme/tokens.ts. Every component reads them, in light and dark.",
  },
  {
    icon: "text-outline",
    title: "Change the font",
    text: "List your font files in appFonts and map them to weights in fontFamilies, both in theme/typography.ts. Text, Button and Input follow.",
  },
  {
    icon: "id-card-outline",
    title: "Name your app",
    text: "Set the name, slug, scheme and bundle identifiers in app.json.",
  },
  {
    icon: "git-network-outline",
    title: "Connect your backend",
    text: "The Data tab walks through it: set OPENAPI_URL, run npm run gen:api, then add your resources in hooks/resources/prod.",
  },
  {
    icon: "trash-outline",
    title: "Remove the example",
    text: "Run npm run strip-example to delete the guide and the demo dashboard in one go. Everything that only exists to teach lives in folders named dev; see Safe to delete below.",
  },
];

export const DEMO_DASHBOARD = {
  title: "The demo dashboard",
  text: "After signing in you land on a small working app: a paginated items list, create and delete, and a profile you can edit with inline validation errors. Each part names the file it is built from. It is the reference for building your own screens, and it deletes in one go.",
};

export const SAFE_TO_DELETE = {
  title: "Safe to delete",
  text: "The guide you are reading and the demo dashboard are example-only. Each lives in its own folder, so removing them takes one go and nothing else depends on them.",
  paths: `screens/dev/              the Home, Data and dashboard screens
components/dev/           the guide's building blocks and live examples
lib/constants/dev/        the guide's text
app/(dashboard)/dev/      the demo mini app routes`,
  note: "Deleting by hand: afterwards, point app/(tabs)/index.tsx and the second tab at your own screens, and rename the dashboard group in app/(dashboard)/_layout.tsx. The UI kit in components/ui, the navigation shell and the data layer stay.",
  script: {
    title: "Or let the script do it",
    text: "npm run strip-example removes all of the above and the resources nothing uses afterwards, then leaves a Hello world Home screen and a Hello dashboard behind. It lists every change and waits for your yes, refuses to run unless your git working tree is clean, and runs the type-check before and after. It stays in the project afterwards and just reports that there is nothing left to strip.",
    code: "npm run strip-example -- --dry-run   # preview only, changes nothing\nnpm run strip-example                # preview, confirm, strip, type-check\ngit restore . && git clean -fd       # undo, if you want it back",
    note: "The -- after the script name passes the flag through npm to the script. Other flags: --yes skips the prompt and --skip-tsc skips the type-checks.",
  },
};

export const UI_KIT_INTRO =
  "Everything below is imported from components/ui. Each entry lists the import, the props and live examples. Components share one size scale, one set of states and the theme, so they look consistent without extra styling.";

export const UI_GROUPS: { key: string; title: string; text: string }[] = [
  {
    key: "foundations",
    title: "Foundations",
    text: "Theme, typography and the shared size scale.",
  },
  {
    key: "controls",
    title: "Controls",
    text: "Buttons and form inputs.",
  },
  {
    key: "display",
    title: "Display",
    text: "Containers, icons and indicators.",
  },
  {
    key: "overlays",
    title: "Overlays",
    text: "Panels and messages that appear above the screen.",
  },
];
