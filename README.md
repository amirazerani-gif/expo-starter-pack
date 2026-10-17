# Expo Starter Pack

A production-ready Expo starter with a public interface, an auth-gated dashboard, and a typed data layer: **OpenAPI-generated types + TanStack Query resource hooks**, with Zustand reserved for app and UI state only.

> Built on **Expo SDK 57** with the **New Architecture** enabled. Ships with a local mock backend, so it runs end to end before you have a server.

---

## What's Included

- **Typed networking.** One `openapi-fetch` client; request and response types are generated from your OpenAPI spec, never written by hand.
- **Resource hooks.** One file per API resource (`hooks/resources/`), holding its types, cache keys, queries and mutations. Screens just call hooks.
- **Caching built in.** TanStack Query provides caching, expiry, refetch on focus and reconnect, retries and pagination.
- **Auth.** A small Zustand store owns the token (persisted in SecureStore). A route guard protects the `(dashboard)` group.
- **Global error handling.** One `ApiError` type, one error store, and toasts through `sonner-native`, with per-request opt-out flags.
- **Mock backend.** `npm run mock` serves the demo contract with Prism, so the sample login, dashboard and items list work immediately.
- **UI kit and theme.** Token-based theme with automatic dark/light mode, plus `Text`, `Input`, `TextArea`, `Button` and `SectionCard`.
- **Forms.** `react-hook-form`, `zod` and `@hookform/resolvers` are installed for form validation.

## Quick Start (with the mock backend)

```bash
gh repo create <your-app-name> --template amirazerani-gif/expo-starter-pack --clone --private
cd <your-app-name>
cp .env.example .env        # then set EXPO_PUBLIC_API_DEV_URL (see below)
npm install

npm run mock                # terminal 1: mock API on port 4010
npx expo start              # terminal 2: the app
```

In `.env`, set `EXPO_PUBLIC_API_DEV_URL` to `http://<your-LAN-IP>:4010` so a physical phone can reach the mock (the file lists the emulator and simulator addresses too). Then sign in with any non-empty login and password, and you land on the dashboard.

The mock returns canned responses and stores nothing: any credentials work, and created or edited items are not saved. It exists so you can see the architecture working.

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

This rewrites `api/schema.d.ts`. Your backend must publish an OpenAPI 3 spec (for Laravel, packages such as Scramble or L5-Swagger produce one). Re-run the command whenever the API changes, and TypeScript will point at every call that no longer matches.

**3. Replace the demo resources.** The files in `hooks/resources/dev/` target the mock contract (`/v1/auth/login`, `/v1/me`, `/v1/items`). Create your own in `hooks/resources/prod/` with the same pattern, using your real paths, and delete the `dev/` folder when you are done. The step-by-step recipe is in [ARCHITECTURE.md](./ARCHITECTURE.md#adding-a-resource).

**4. Move the auth store.** Create `stores/prod/auth.store.ts` (copy `stores/dev/auth.store.ts` and adjust if your login returns more than a token), then update the `useAuthStore` import in:
`api/client.ts`, `lib/queryClient.ts`, `app/_layout.tsx`, `app/(dashboard)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(tabs)/account.tsx`, and your resource hooks.

**5. Adjust the shape helpers if your API differs.**
- Different envelope: edit `unwrap` and `unwrapMessage` in `api/client.ts`.
- Different pagination (cursor, offset): edit `api/pagination.ts`, the only file that knows the paging shape.
- Different error body: edit `ErrorBody` in `api/errors.ts`.

**6. Replace the sample screens.** Point the login fields at your credentials, rebuild the dashboard, and remove the Items demo from the account screen.

## Project Structure

```
app/                       Expo Router files only: layouts, guards and thin route files
  (auth)/                  Unauthenticated screens (login, ...)
  (tabs)/                  Public tab interface
  (dashboard)/             Auth-gated area; _layout.tsx is the guard
    user/                  A dashboard group (add more as siblings)
screens/                   Screen implementations; route files render these
components/
  ui/                      UI primitives (Text, Input, TextArea, Button, SectionCard)
  navigation/              Tab bar and navigation chrome
theme/                     Tokens, spacing, radius, useTheme()
api/
  client.ts                The single openapi-fetch client, unwrappers, multipart helper
  errors.ts                ApiError and isApiError
  pagination.ts            unwrapPage / flatPages
  types.ts                 JsonBody / ResData / ResItem type helpers
  schema.d.ts              GENERATED from the OpenAPI spec (do not edit)
hooks/
  core/                    Prebuilt hooks (ErrorToastListener)
  resources/dev|prod/      One file per API resource (*.r.ts)
stores/
  core/                    Error store
  dev|prod/                Auth store
lib/                       queryClient, fonts and other infrastructure
openapi/openapi.yaml       Demo contract served by the mock
scripts/gen-api.mjs        Schema generation script
```

## Core Dependencies

| Package | Purpose |
|---|---|
| `expo-router` | File-based navigation |
| `@tanstack/react-query` | Server state: caching, refetching, pagination, mutations |
| `openapi-fetch` | Typed HTTP client driven by the generated schema |
| `zustand` | App and UI state only (auth token, error toast, UI toggles) |
| `expo-secure-store` | Token storage |
| `react-hook-form`, `zod`, `@hookform/resolvers` | Form state and validation |
| `@react-native-community/netinfo` | Connectivity for the offline screen and query pausing |
| `react-native-size-matters` | Responsive scaling |
| `sonner-native` | Toast notifications |
| `react-native-reanimated` | Animations |
| `@expo/vector-icons` | Icons |

## Further Reading

[ARCHITECTURE.md](./ARCHITECTURE.md) explains the rules, each layer, the error-flag system, the auth flow and how to add resources, screens and routes.

## Notes

- All UI primitives read the theme tokens: update them in `theme/` to rebrand the whole app.
- `npm run gen:api` and `npm run mock` fetch tooling with `npx` on first use, so they need internet access.