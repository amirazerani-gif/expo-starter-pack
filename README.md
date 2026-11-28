# Expo Starter Pack

A production-ready Expo starter with a public tab interface, an auth-gated dashboard, a typed data layer and a themed UI kit: **OpenAPI-generated types + TanStack Query hooks**, with Zustand reserved for app and UI state.

> Built on **Expo SDK 58** (React Native 0.88, React 19.3) with the **New Architecture**. It ships with a local mock backend, so it runs end to end before you have a server.

https://github.com/user-attachments/assets/0da3b438-e002-47d4-9123-2e1707458351

```bash
npx create-expo-app my-app --template @amirgazerani/expo-starter-pack
```

---

## What's Included

- **Typed networking.** One `openapi-fetch` client plus `openapi-react-query`. Request and response types, and every cache key, are derived from your OpenAPI spec. Nothing is written by hand.
- **Resource hooks.** One file per API resource in `hooks/resources/`. Screens call hooks and render.
- **Caching built in.** TanStack Query handles caching, expiry, refetch on focus and reconnect, retries and pagination.
- **Auth.** A small Zustand store owns the token (persisted in SecureStore). A route guard protects the `(dashboard)` group, and an expired token signs the user out automatically.
- **Global error handling.** One `ApiError` type, one error store and toasts, with per-request flags for screens that show errors inline.
- **Navigation shell.** A floating tab bar with a menu panel, a header with an account entry, and a guarded dashboard.
- **UI kit and theme.** Token-based theme with light and dark mode, one size scale, one place to set the font, and a full set of documented components (buttons, inputs, switches, dropdowns, modals, toasts and more). See [The UI Kit](#the-ui-kit).
- **Mock backend.** `npm run mock` serves the demo contract with Prism, so login, items and profile work immediately.
- **A guide inside the app.** The Home and Data tabs document the template with live examples, and the demo dashboard shows every data pattern working. Remove all of it with one command.

## Requirements

- Node 22.13 or newer
- An iOS simulator, an Android emulator, a device with a development build, or Expo Go if it supports SDK 58
- For Android native builds: JDK 17 and `ANDROID_HOME` set (a newer JDK can break the Gradle build)

## Quick Start (with the mock backend)

```bash
npx create-expo-app my-app --template @amirgazerani/expo-starter-pack
cd my-app
cp .env.example .env        # then set EXPO_PUBLIC_API_DEV_URL (see below)
npm install

npm run mock                # terminal 1: mock API on port 4010
npx expo start              # terminal 2: the app
```

In `.env`, set `EXPO_PUBLIC_API_DEV_URL` to `http://<your-LAN-IP>:4010` so a physical phone can reach the mock (the file lists the emulator and simulator addresses too). Then sign in with any non-empty login and password and you land on the demo dashboard.

The mock returns canned responses and stores nothing: any credentials work, and created or edited items are not saved. It exists so you can see the architecture working.

> Prefer GitHub? `gh repo create my-app --template amirazerani-gif/expo-starter-pack --clone --private` works too.

## Removing the Example

Everything that exists only to teach lives in folders named `dev`: the Home and Data screens, the demo dashboard, the guide's components and its text. When you are ready to build your own app, run:

```bash
npm run strip-example -- --dry-run   # preview, changes nothing
npm run strip-example                # preview, confirm, strip, type-check
```

It deletes the example, removes the resources nothing uses afterwards, and leaves a Hello world Home screen and a Hello dashboard behind. It refuses to run unless your git working tree is clean, so `git restore . && git clean -fd` undoes it. (The `--` passes the flag through npm to the script.) Projects created with the template start with a clean tree, because `create-expo-app` makes the first commit.

Afterwards, the README, this file's structure section and ARCHITECTURE.md still describe the example: update them for your app.

## Connecting Your Own Backend

The template assumes a Laravel-style JSON API (`{ message, data }` envelopes, `meta` pagination, 422 validation errors). Adapting it takes these steps.

**1. Point the app at your server.** In `.env`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=https://api.yourapp.com/api     # production root, including any /api prefix
EXPO_PUBLIC_API_DEV_URL=https://staging.yourapp.com/api  # dev / staging root
EXPO_PUBLIC_IS_TESTING=true                              # true -> dev URL, false -> production URL
```

Restart with `npx expo start -c`; environment values are baked in at build time.

**2. Generate types from your spec.** Set `OPENAPI_URL` to your backend's OpenAPI document (a URL or a file path), then run:

```bash
npm run gen:api
```

This rewrites `api/schema.d.ts`. Your backend must publish an OpenAPI 3 spec (for Laravel, packages such as Scramble or L5-Swagger produce one). Re-run the command whenever the API changes, and TypeScript points at every call that no longer matches.

**3. Replace the demo resources.** The files in `hooks/resources/dev/` target the mock contract (`/v1/auth/login`, `/v1/me`, `/v1/items`). Create your own in `hooks/resources/prod/` with the same pattern, using your real paths. The recipe is in [ARCHITECTURE.md](./ARCHITECTURE.md#adding-a-resource).

**4. Move the auth store.** Create `stores/prod/auth.store.ts` (copy `stores/dev/auth.store.ts` and adjust it if your login returns more than a token), then update every import of the dev store. List them with:

```bash
git grep -n "stores/dev/auth.store"
```

Do the same for `hooks/resources/dev` imports (`git grep -n "resources/dev"`): the header, the drawer and the login screen read the dev auth and user hooks.

**5. Adjust the shape helpers if your API differs.**
- Different envelope: edit `unwrap` in `api/client.ts` and the `select` in your hooks.
- Different pagination (cursor, offset): edit `api/pagination.ts`, the only file that knows the paging shape.
- Different error body: edit `ErrorBody` and `fieldErrors` in `api/errors.ts`.
- Different auth rules: edit the middleware in `api/client.ts` (the header and the sign-out status).

**6. Replace the sample screens.** Point the login fields at your credentials, and build your own dashboard group (or run the strip script for an empty one).

## Project Structure

```
app/                       Expo Router files only: layouts, guards and thin route files
  (tabs)/                  Public tab interface (Home and Data, example only)
  (auth)/                  Unauthenticated screens (login)
  (dashboard)/             Auth-gated area; _layout.tsx is the guard
    dev/                   The demo dashboard group (example only)
  no-internet.tsx          Shown while the device is offline
screens/
  dev/                     Home, Data and demo dashboard screens (example only)
components/
  ui/                      The UI kit
  navigation/              Tab bar, header, drawer content
  dev/                     Building blocks and live demos for the guide (example only)
theme/                     Tokens, size scale, typography, useTheme()
api/
  client.ts                The openapi-fetch client, middleware, unwrap, multipart
  query.ts                 $api: typed query and mutation hooks
  errors.ts                ApiError, isApiError, field errors
  pagination.ts            Page-number pagination
  types.ts                 JsonBody / ResData / ResItem type helpers
  schema.d.ts              GENERATED from the OpenAPI spec (do not edit)
hooks/
  core/                    Prebuilt hooks (ErrorToastListener, usePresence)
  resources/dev|prod/      One file per API resource (*.r.ts)
stores/
  core/                    Error store
  dev|prod/                Auth store
lib/
  constants/dev/           The guide's text (example only)
  queryClient.ts           The query client and everything wired to it
openapi/openapi.yaml       Demo contract served by the mock
scripts/                   gen-api.mjs, strip-example.mjs
```

## The UI Kit

Everything is imported from `components/ui` and styled from the theme, so the components look consistent without extra styling.

| Group | Components |
|---|---|
| Foundations | `theme` tokens, `Text` and typography, the shared control size scale |
| Controls | `Button`, `Input`, `TextArea`, `Switch`, `Checkbox`, `RadioGroup`, `Chip` |
| Display | `Card`, `Icon`, `Badge`, `Avatar` |
| Overlays | `Dropdown`, `Modal`, `Toast` |

- **Rebrand:** edit the colors, radius and spacing in `theme/tokens.ts`.
- **Change the font:** list your font files in `appFonts` and map them to weights in `fontFamilies`, both in `theme/typography.ts`. Set `defaultFamily` to choose the family every component uses.
- **Resize the kit:** the control heights live in `theme/sizes.ts`.

Props, signatures and live examples for every component are on the Home tab, and the standards behind them are in [ARCHITECTURE.md](./ARCHITECTURE.md#components-and-theme).

## Commands

| Command | What it does |
|---|---|
| `npx expo start` | Start the app (`-c` clears the cache) |
| `npm run mock` | Serve the demo API on port 4010 |
| `npm run gen:api` | Regenerate `api/schema.d.ts` from the spec |
| `npm run strip-example` | Remove the example app (see above) |
| `npx tsc --noEmit` | Type-check the project |

## Core Dependencies

| Package | Purpose |
|---|---|
| `expo-router` | File-based navigation, typed routes |
| `@tanstack/react-query` | Server state: caching, refetching, pagination, mutations |
| `openapi-fetch`, `openapi-react-query` | Typed HTTP client and hooks driven by the generated schema |
| `zustand` | App and UI state only (auth token, error, toasts) |
| `expo-secure-store` | Token storage |
| `react-hook-form`, `zod`, `@hookform/resolvers` | Form state and validation |
| `@react-native-community/netinfo` | Connectivity for the offline screen and query pausing |
| `react-native-size-matters` | Responsive scaling |
| `expo-linear-gradient` | Gradient buttons and cards |
| `@expo/vector-icons` | Icons (Ionicons) |
| `react-native-reanimated` | Installed; the UI kit animates with React Native's `Animated` |
| `expo-system-ui` | Makes `userInterfaceStyle: "automatic"` work on Android, so the light and dark theme follows the system |

## Further Reading

- [ARCHITECTURE.md](./ARCHITECTURE.md): the rules, each layer, the error flags, the auth flow, the UI standards, and how to add resources, screens and components.
- [AGENTS.md](./AGENTS.md): the same conventions, condensed for coding agents.

## Notes

- `npm run gen:api` and `npm run mock` fetch tooling with `npx` on first use, so they need internet access.
- The mock is stateless and serves one page of items, so create, delete and "load more" are visible in the Prism terminal but not in the list.
