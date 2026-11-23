# AGENTS.md

Instructions for coding agents working in this repository. Humans: see README.md and ARCHITECTURE.md; this file is the short version.

## Project

Expo SDK 58 template (React Native 0.88, React 19.3, TypeScript strict, New Architecture, expo-router with typed routes). Typed OpenAPI networking, TanStack Query, zustand, a themed UI kit and a Prism mock backend.

## Commands

- `npx expo start` (add `-c` to clear the cache; env values are baked in at build time)
- `npm run mock` serves the demo API on port 4010
- `npm run gen:api` regenerates `api/schema.d.ts` from the spec (`OPENAPI_URL` or `openapi/openapi.yaml`)
- `npx tsc --noEmit` must be clean before you finish a task
- `npm run strip-example` removes the example app (see "dev folders")

## Layout

- `app/`: routes only (layouts, guards, thin route files that re-export a screen). No UI logic here.
- `screens/`: screen implementations. `components/ui/`: the UI kit. `components/navigation/`: tab bar, header, drawer content.
- `api/`: client, `$api`, errors, pagination, type helpers. `api/schema.d.ts` is generated: never edit it.
- `hooks/resources/<dev|prod>/*.r.ts`: one file per API resource. `hooks/core/`: shared hooks.
- `stores/`: zustand stores. `theme/`: tokens, sizes, typography. `lib/queryClient.ts`: the query client and its wiring.
- Import with the `@/` alias, never long relative paths.

## Naming

- Component and hook files: camelCase (`textArea.tsx`, `usePresence.ts`). Screens: PascalCase (`HomeScreen.tsx`). Resources: `Name.r.ts`.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, with a short title and `-` bullets.

## Data rules

1. API types come from the schema (`api/types.ts` helpers: `JsonBody`, `ResData`, `ResItem`). Never hand-write an API type.
2. Server data lives in TanStack Query; zustand holds app and UI state only (auth token and status, error). Never copy server data (such as the user) into a store.
3. Components and screens never call `client` or `fetch`. They call resource hooks.
4. Cache keys come from `$api.queryOptions(method, path, init).queryKey`. Never write a key array by hand and never add a key factory.
5. Queries: build `$api.queryOptions(...)` with an **inline** `select: (res) => res.data`, then `useQuery`. A shared generic select helper loses the response type.
6. Mutations are automatic by default: `$api.useMutation(method, path, { onSuccess })`, called as `mutate({ body, params })`. Write one by hand (`useMutation` + `client` + `unwrap`) only when the hook must shape the request or result (login adds `device_name` and stores the token).
7. Mutations invalidate on success; they do not patch the cache. After deleting a record, `removeQueries` for its detail key, then invalidate the list.
8. Errors: the client throws `ApiError` for every non-2xx. Queries are silent unless `meta: { reportErrors: true }`. Mutations toast unless `meta: { skipGlobalError: true }`, which covers 4xx only. Forms set `skipGlobalError` and show `error.fieldErrors` inline.
9. A hook's `error` is typed from the spec and may be `never`: read it as `unknown` and narrow with `isApiError`.
10. A string option that names a spec field (like `pageParamName`) needs a `satisfies QueryParamName<...>` guard.
11. Uploads: `multipart({ field: { uri, name, type } })`.
12. After a schema change, run `npm run gen:api` and fix every type error.

## UI rules

- Use `components/ui` primitives. Do not use raw `Text` or `Pressable` for something a primitive covers.
- Read colors, radius and spacing from `useTheme()`. Never hard-code a color, a font or a size that a token covers.
- Fonts are global: `theme/typography.ts` (`fontFamilies`, `defaultFamily`, weight roles, sizes). Never write a font family or weight name in a component. Use `<Text size weight family />` and the shortcuts.
- Every control shares one size scale: `size?: "sm" | "md" | "lg"` and `controlMetrics(size)` from `theme/sizes.ts`. Use `CONTROL_BORDER`, `DISABLED_OPACITY` and `PRESSED_OPACITY`; do not invent per-component numbers. Touch targets extend to 44 with `hitSlop`.
- Icons are passed as Ionicons names (`IconName`), not elements.
- Solid and gradient button labels use `palette.white`; other text uses the themed `Text` color.
- Refs to RN components: `React.ComponentRef<typeof TextInput>` (RN 0.87+ types make `TextInput` a function component type; `TextInputRef` lives in `components/ui/field.tsx`).
- Animations use React Native's `Animated` and `usePresence` (`hooks/core/usePresence.ts`) for mount and exit.
- Overlays: `Modal` (center, sheet, fullscreen, drawer), `Dropdown` (also the recipe for a select), `toast` from anywhere. `<ToastHost />` and `<ErrorToastListener />` are mounted once in `app/_layout.tsx`.
- Scrollable screens under the tab bar reserve `insets.bottom + TAB_BAR_CLEARANCE`.
- New component checklist: camelCase file in `components/ui`, `size` from the scale, theme colors, typography from `Text`, disabled and pressed states from the shared constants, forwarded ref if it wraps an input, no data fetching.

## Navigation and auth

- Public tabs live in `app/(tabs)`; a tab appears when its screen has a `tabBarIcon` option. The tab bar navigates with `navigateToTab(route.key)` (the route key, not the name).
- `app/(dashboard)/_layout.tsx` is the guard: guests go to login, signed-in users outside `VALID_DASHBOARD_GROUPS` go to `DEFAULT_GROUP`. A new group is a folder with its own `_layout.tsx` plus an entry in `VALID_DASHBOARD_GROUPS`.
- Auth status is `loading | authed | guest`; the root layout holds the splash until it is not `loading`. A 401 on a request that carried a token clears the session; when the status becomes `guest`, `lib/queryClient.ts` cancels queries and clears the cache.
- Roles are server state: read them from `useMe()`, never from the auth store.

## The `dev` folders

Everything example-only lives in folders named `dev`: `screens/dev`, `components/dev`, `lib/constants/dev`, `app/(dashboard)/dev`. `hooks/resources/dev` and `stores/dev` are the mock-backend implementations that real projects replace with `prod`. `npm run strip-example` removes the example (it refuses to run on a dirty git tree). Do not put anything the real app needs inside the example `dev` folders.

## Before you finish

- `npx tsc --noEmit` is clean.
- No new hard-coded colors, fonts or sizes; no hand-written API types or cache keys.
- Docs (README, ARCHITECTURE.md, `lib/constants/dev/*` text) updated if a convention, path or API changed.
- Do not edit `api/schema.d.ts`, `.env` or lock files by hand, and do not run `npm audit fix --force`.