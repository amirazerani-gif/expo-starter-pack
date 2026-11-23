# Architecture

How the template is organized and why. Read this before adding features; it keeps every project built from the template consistent.

## The Rules

1. **Types come from the schema.** Request and response types are generated from the OpenAPI spec (`api/schema.d.ts`) and named through helpers in `api/types.ts`. Never hand-write an API type.
2. **Cache keys come from the schema too.** Keys are derived from the method, path and request by `$api` (openapi-react-query). Never write a key array by hand.
3. **Server data lives in TanStack Query.** Anything that comes from, or is saved to, the backend (the user, lists, details) is server state. It is cached, expired and refetched by TanStack Query, and never copied into a store.
4. **Zustand is for app and UI state only.** The auth token and status, the current error and UI toggles belong in stores. If it came from the API, it does not.
5. **One resource, one file.** Each API resource has a single hooks file with its query options and hooks. Components never call the client directly.
6. **Components stay thin.** Screens call resource hooks and render. No `fetch`, no cache keys, no envelope handling in UI code.
7. **Mutations invalidate; they do not patch the cache.** After a write, invalidate the affected keys and let the refetch bring the truth.
8. **Failures throw.** The client throws an `ApiError` for any non-2xx response, so hooks never branch on an `error` field.
9. **Tokens, not literals.** Colors, radius, spacing, sizes and fonts come from the theme. A component never hard-codes them.

## How Data Flows

```
Screen ──calls──▶ resource hook (hooks/resources/*.r.ts)
                       │  $api.queryOptions / $api.useMutation
                       ▼
                  api/client.ts  (openapi-fetch + middleware)
                       │  adds token, throws ApiError on non-2xx,
                       │  signs out on an authenticated 401
                       ▼
                    Backend

Result ──▶ TanStack Query cache ──▶ Screen
Failure ─▶ lib/queryClient.ts routing ─▶ error store ─▶ toast
                                      └▶ or inline in the screen
```

State ownership:

| State | Where | Example |
|---|---|---|
| Server state | TanStack Query | current user, items, any list or detail |
| App state | Zustand (`stores/`) | auth token and status, the pending error |
| UI state | Zustand or `useState` | open drawer, selected filter |
| Form state | `react-hook-form` or `useState` | input values, field errors |

## The API Layer (`api/`)

### `client.ts`

The single `openapi-fetch` instance. Its middleware:

- attaches `Authorization: Bearer <token>` from the auth store
- logs failures and throws an `ApiError` for every non-2xx response
- ends the session when an *authenticated* request returns 401 (a wrong-password login does not count, because it carries no token)
- logs network failures and lets them propagate

The base URL is chosen by `EXPO_PUBLIC_IS_TESTING`: `true` uses `EXPO_PUBLIC_API_DEV_URL`, `false` uses `EXPO_PUBLIC_API_BASE_URL`. The app fails fast at start if the chosen URL is missing.

### `query.ts`

Exports `$api`, the openapi-react-query wrapper around the client. It provides typed `queryOptions`, `useQuery`, `useInfiniteQuery` and `useMutation`. Paths, params, bodies and responses are all inferred from `schema.d.ts`.

### Helpers in `client.ts`

| Helper | Use |
|---|---|
| `unwrap(call)` | resolves the envelope's `data`; used by hand-written mutations |
| `multipart(fields)` | request options for file uploads: `multipart({ avatar: { uri, name, type } })` |

For hooks that use `$api`, the envelope is removed with an inline `select: (res) => res.data` on queries; a mutation's `onSuccess` receives the whole envelope (`res.data`, `res.message`).

### Type helpers (`types.ts`)

```ts
JsonBody<"/v1/auth/login", "post">   // request body
ResData<"/v1/items/{item}">          // `data` of the 200 response
ResItem<"/v1/items">                 // one element of a list response
```

The method defaults to `"get"`. `ResData` reads the `200` response; for an endpoint that returns another success code, take the type from the hook's return value instead.

### Errors (`errors.ts`)

`ApiError` carries `status`, `body`, `method` and `url`, plus `fieldErrors` (the first message per field, ready for inputs). Check with `isApiError(error)`. The error body shape is Laravel's `{ message, errors }`; change `ErrorBody` if your backend differs.

### Pagination (`pagination.ts`)

Handles standard Laravel page-number pagination (`meta.current_page` and `meta.last_page`) through `nextLaravelPage`. For cursor or offset pagination, edit this file. It is the only place that knows the paging shape, so resource hooks do not change.

## Resources (`hooks/resources/`)

A resource file is named in PascalCase with the `.r.ts` suffix (`Items.r.ts`). It exports, as needed:

1. **Types** derived from the schema (`export type Item = ResItem<"/v1/items">`)
2. **Query options** built with `$api.queryOptions`, reusable for prefetching and invalidation
3. **Query hooks** wrapping the options (`useItems`, `useMe`)
4. **Mutation hooks** (`useCreateItem`, `useDeleteItem`, ...) that invalidate on success

`dev/` holds resources for the mock backend; `prod/` is where your real resources go. `Items.r.ts` is the worked example: copy it.

### Queries and keys

Build the options from `$api`, unwrap the envelope with an **inline** `select`, and pass them to `useQuery`. Write the `select` inline: a shared generic helper loses the response type.

```ts
export const meOptions = () =>
  $api.queryOptions("get", "/v1/me", undefined, {
    select: (res) => res.data,
    meta: { reportErrors: true },
  });

export function useMe() {
  const status = useAuthStore((s) => s.status);
  return useQuery({ ...meOptions(), enabled: status === "authed" });
}
```

- Invalidate with `$api.queryOptions("get", path).queryKey`, never a literal array.
- The list key prefix-matches an infinite list but not detail queries. Invalidate a detail explicitly.
- `$api` passes the abort signal to the client for you.

### Infinite lists

```ts
const query = $api.useInfiniteQuery(
  "get", "/v1/items", {},
  {
    pageParamName: "page" satisfies QueryParamName<"/v1/items">,
    initialPageParam: 1,
    getNextPageParam: nextLaravelPage,
    select: (data) => data.pages.flatMap((page) => page.data),
    meta: { reportErrors: true },
  },
);
return { ...query, items: query.data ?? NO_ITEMS };
```

A string option that names a spec field (like `pageParamName`) needs the `satisfies QueryParamName` guard: TypeScript cannot check it otherwise.

### Mutations: two styles

**Automatic (the default).** The variables are the request, so `$api.useMutation` builds the call from the spec and you call `mutate({ body, params })`.

```ts
export function useCreateItem() {
  const queryClient = useQueryClient();
  return $api.useMutation("post", "/v1/items", {
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/v1/items").queryKey,
      }),
    meta: { skipGlobalError: true },
  });
}

createItem.mutate({ body: { title, description: null } });
```

**Manual.** Write a plain `useMutation` whose `mutationFn` calls `client` and `unwrap` when the hook must shape the request before it is sent or the result before it is used. Login is the case: it adds a `device_name` the screen should not know about, then stores the token.

```ts
export function useLogin() {
  return useMutation({
    mutationFn: async (body: JsonBody<"/v1/auth/login", "post">) =>
      unwrap(
        client.POST("/v1/auth/login", {
          body: { device_name: DEVICE_NAME, ...body },
        }),
      ),
    onSuccess: (session) =>
      useAuthStore.getState().setSession(session.token),
    meta: { skipGlobalError: true },
  });
}
```

Rule of thumb: if the screen can pass the request as it is, use `$api.useMutation`. If the hook adds, hides or transforms something, write it by hand. Both styles keep the same typing, the same `ApiError` and the same global error handling. Mutations never retry.

### Deleting by id

A hook that targets one record does not take the id as an argument. The screen passes it in the path params, so one hook serves every row. After the delete, drop that item's cached detail (a refetch would 404) and refresh the list.

```ts
export function useDeleteItem() {
  const queryClient = useQueryClient();
  return $api.useMutation("delete", "/v1/items/{item}", {
    onSuccess: (_res, variables) => {
      queryClient.removeQueries({
        queryKey: itemOptions(variables.params.path.item).queryKey,
      });
      return queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/v1/items").queryKey,
      });
    },
  });
}

deleteItem.mutate({ params: { path: { item: item.id } } });
```

### File uploads

Wrap the file in `multipart()`. The file is `{ uri, name, type }`, which is what an image picker returns. The template has no picker, because that is a package your app adds.

```ts
upload.mutate(multipart({ avatar: { uri, name, type } }));
upload.mutate({ params, ...multipart({ avatar: file }) }); // with path params
```

### Adding a resource

1. Make sure the endpoint is in your spec and run `npm run gen:api`.
2. Create `hooks/resources/prod/Posts.r.ts`:

```ts
import { $api } from "@/api/query";
import type { ResData } from "@/api/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type Post = ResData<"/v1/posts/{post}">;

export const postOptions = (id: number) =>
  $api.queryOptions(
    "get",
    "/v1/posts/{post}",
    { params: { path: { post: id } } },
    { select: (res) => res.data, meta: { reportErrors: true } },
  );

export const usePost = (id: number | undefined) =>
  useQuery({ ...postOptions(id ?? 0), enabled: id != null });

export function useCreatePost() {
  const queryClient = useQueryClient();
  return $api.useMutation("post", "/v1/posts", {
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/v1/posts").queryKey,
      }),
    meta: { skipGlobalError: true },
  });
}
```

3. Use it in a screen: `const { data: post, isLoading } = usePost(id);`

For lists use `$api.useInfiniteQuery` as above. For writes, invalidate the affected keys in `onSuccess`.

## Error Handling

### The flags

Two typed `meta` flags control whether a failure becomes a global toast or is left to the screen:

| Flag | On | Effect |
|---|---|---|
| `meta: { reportErrors: true }` | queries | Toast when this query fails. Queries are **silent by default**, so a background refetch never interrupts the user. |
| `meta: { skipGlobalError: true }` | mutations | Skip the toast for 4xx errors, because the screen shows them inline. Mutations **toast by default**. |

`skipGlobalError` only covers 4xx. A 5xx or a network failure on a mutation always toasts, since nothing inline can handle it.

Choosing a flag:

- Mutation behind a form (login, update profile, create item): `skipGlobalError`, and show `error.fieldErrors` or `error.message` inline.
- Mutation with no form (logout, delete, a "resend" button): no flag, so the toast is the feedback.
- Query whose failure matters (a detail screen with no cached fallback): `reportErrors`.
- Background or secondary query: no flag.

### Showing an error inline

A hook's error is typed from the spec and may be `never`, so read it as `unknown` and narrow:

```tsx
const { mutate, error } = useUpdateMe();   // skipGlobalError

const failure: unknown = error;
const inline = isApiError(failure) && failure.status < 500 ? failure : null;
const fields = inline?.fieldErrors ?? {};
const general = inline && !fields.name && !fields.email ? inline.message : null;

<Input label="Name" error={fields.name} />
```

### The pipeline

1. `api/client.ts` throws an `ApiError` (or fetch throws a network `TypeError`).
2. The `QueryCache` / `MutationCache` in `lib/queryClient.ts` applies the flag rules.
3. If the error should surface, it calls `useErrorStore.getState().reportError(error)`.
4. `stores/core/error.store.ts` classifies it (validation, auth, forbidden, not found, server, network, unknown), logs it and publishes it. Cancelled requests are ignored.
5. `ErrorToastListener` (mounted in the root layout next to `ToastHost`) shows a toast: the message, the remaining validation errors as details and the status as a badge. To change a toast's title or duration per error type, edit `ERROR_CONFIG` in `hooks/core/useErrorListener.ts`.

`useErrorStore.getState().showError(error)` does the same as `reportError` and then rethrows, for the rare call site that wants to surface an error and still propagate it.

### Retries and connectivity

Queries retry twice on 5xx and network failures and never on 4xx (`lib/queryClient.ts`); mutations never retry, so a form cannot be silently submitted twice. Requests pause while offline and resume on reconnect, and the root layout redirects to `/no-internet` while the device is offline and back to the previous route afterwards.

## Auth

### The store (`stores/dev/auth.store.ts`)

Owns client state only: `token` and `status` (`loading`, `authed` or `guest`), plus `hydrate()`, `setSession(token)` and `clearSession()`. The token is persisted in SecureStore, which the OS stores encrypted. The user object is **not** here; it is server state in `useMe()`.

### The flow

1. **Boot.** The root layout calls `hydrate()` and holds the splash screen until fonts are loaded and the status is no longer `loading`. Guards therefore only ever see `authed` or `guest`.
2. **Sign in.** `useLogin()` (a manual mutation) calls the endpoint and, on success, runs `setSession(token)`. The login screen navigates when the status becomes `authed`.
3. **Requests.** The client middleware reads the token on every request.
4. **Sign out.** `useLogout()` calls the endpoint and clears the session even if the request fails.
5. **Expired token.** A 401 on an authenticated request clears the session.
6. **Cleanup.** When the status becomes `guest` for any reason, `lib/queryClient.ts` cancels in-flight queries and clears the cache, so no data leaks to the next user.
7. **Redirect.** The dashboard guard sees `guest` and returns the user to login. No extra code is needed in the logout button.

### Switching to a real backend

Create `stores/prod/auth.store.ts` and update the imports (`git grep -n "stores/dev/auth.store"`). Resource hooks for auth belong in `hooks/resources/prod/`.

## Routes and Screens

### Convention

`app/` holds **route files only**: layouts, guards and thin route files. Screen implementations live in `screens/` and are rendered by the route:

```tsx
// app/(dashboard)/dev/items.tsx
export { default } from "@/screens/dev/dashboard/DashboardItemsScreen";
```

This keeps routing (URLs, groups, guards) separate from UI, so screens can be reused, moved or tested without touching the router.

### Route groups

| Group | Purpose | Guard |
|---|---|---|
| `(tabs)` | Public tab interface | none |
| `(auth)` | Login and other unauthenticated screens | none |
| `(dashboard)` | Authenticated area | `app/(dashboard)/_layout.tsx` |

### The dashboard guard

`app/(dashboard)/_layout.tsx` reads the auth status. Guests are redirected to login. Signed-in users landing outside a known group are sent to `DEFAULT_GROUP`.

To add a group (for example `admin`):

1. Create `app/(dashboard)/admin/` with its own `_layout.tsx` and routes.
2. Add `"admin"` to `VALID_DASHBOARD_GROUPS` in the guard.

### Roles

The template does no role branching, because a role is server state, not auth state. If your backend has roles, read the role from `useMe()` in the guard and redirect to the matching group. Filter menus from the same data, and also enforce the role on the server: hiding a link is not security.

### Adding a screen

1. Build it in `screens/<area>/<Name>Screen.tsx`, using resource hooks and UI primitives.
2. Add a route file that re-exports it from the right group.
3. For a new top-level group, register it in `app/_layout.tsx` as a `<Stack.Screen />`.

## The Navigation Shell (`components/navigation/`)

- **Tab bar** (`tabbar.tsx`): a floating bar for `app/(tabs)`. Every screen registered in the tabs layout with a `tabBarIcon` option becomes a tab, in layout order, with the title and icon from its options, so adding a tab never means editing the bar. A Menu button opens a panel above the bar that lists the same screens and holds `DrawerContent`. Navigation goes through `navigateToTab(route.key)`: it takes the route **key**, not the name.
- **Reserve space under it.** The bar floats over screens. Scrollable content under it uses bottom padding of `insets.bottom + TAB_BAR_CLEARANCE`.
- **Header** (`header.tsx`): back button (when there is history), the title, and an account entry: an avatar that opens the dashboard when signed in, a "Sign in" button for guests. It applies the top safe-area inset itself, so screens beneath it must not add `insets.top`.
- **Drawer content** (`drawerContent.tsx`): the menu panel's body. A list of links plus an account section: avatar, name, "Open dashboard" and "Sign out" when signed in, "Sign in" for guests. Panel height is `DRAWER_HEIGHT` in `tabbar.tsx`; content that overflows scrolls.

The header and drawer read the dev auth store and resource hooks; point them at your `prod` counterparts when you connect a real backend.

## Components and Theme

### Theme (`theme/`)

| File | Holds |
|---|---|
| `tokens.ts` | Colors (a light and a dark set chosen by the device), radius, spacing |
| `sizes.ts` | The control size scale and shared state constants |
| `typography.ts` | Fonts, weights, text sizes, line height |
| `useTheme.ts` | The hook that returns the active tokens |

```ts
const { theme, isDark, radius, spacing } = useTheme();

theme.primary  secondary  success  warning  error  info
theme.background  backgroundSecondary  surface  border  textPrimary  textSecondary
theme.primaryDark
radius   xs 6 · sm 10 · md 14 · lg 20 · xl 28 · full
spacing  xs 4 · sm 8 · md 16 · lg 24 · xl 32 · xxl 48
```

Never hard-code a color in a screen. To rebrand the app, edit the tokens.

### Typography

Fonts are global and configured in one file, `theme/typography.ts`:

- `appFonts`: the font files to load (loaded in `app/_layout.tsx`).
- `fontFamilies`: families mapped to the four weights (`regular`, `medium`, `semibold`, `bold`). You can define several.
- `typography.defaultFamily`: the family every component uses unless an element sets `family`. This is how you switch the whole app's font.
- Weight roles: `defaultWeight` (body text), `controlWeight` (button labels), `labelWeight` (field labels).
- `typography.sizes`: `xs` (11) up to `xxl` (28), with `lineHeight` 1.45 and a moderate scaling factor so text adapts to screen size.

Components never name a font. Use `<Text size weight family />` or its shortcuts (`medium`, `semibold`, `bold`, `dim`, `inverse`).

### Control sizes

Every control (`Button`, `Input`, `TextArea`, `Chip`, `Checkbox`, `RadioGroup`) uses the same scale from `theme/sizes.ts`: `size?: "sm" | "md" | "lg"`, with heights 25, 30 and 35 (scaled), so a `md` button and a `md` input are the same height. `controlMetrics(size)` returns `{ height, font, paddingX, icon, gap, hitSlop }`. Each control extends its touch area to 44. Shared constants: `CONTROL_BORDER` 1, `DISABLED_OPACITY` 0.5, `PRESSED_OPACITY` 0.8, `OVERLAY_COLOR`. Edit the numbers once to resize the kit.

### The component map (`components/ui/`)

| Component | Notes |
|---|---|
| `Text` | The only text component; themed color, global fonts |
| `Button` | `solid`, `outline`, `ghost`, `gradient`; icons, loading, `fullWidth` |
| `Input`, `TextArea` | Label, hint, error; icons; password toggle; forward refs |
| `Switch` | Wraps the native switch with theme colors |
| `Checkbox` | Label, hint, error; `indeterminate` |
| `RadioGroup` | Generic over string or number values |
| `Chip` | Selectable, removable, optional icon |
| `Card` | Bordered surface; `bg`, `gradient`, `padding` |
| `Icon` | Ionicons by name (`IconName`) |
| `Badge` | Label, count or dot; tones and variants; its own compact scale |
| `Avatar` | Image with initials fallback; sizes; status dot |
| `Dropdown` | A panel under or over a trigger; flips when there is no room. A select is a Dropdown with rows |
| `Modal` | `center`, `sheet`, `fullscreen` and `drawer` (left or right, width in percent) |
| `Toast` | `toast.success/error/warning/info/show/dismiss`; `<ToastHost />` mounted once |
| `field.tsx` | Shared label, hint and error wrapper; exports `TextInputRef` |

Props, signatures and live examples for each are on the Home tab (`lib/constants/dev/componentDocs.ts` and `components/dev/componentDemos.tsx`).

### Standards for components

- A control takes `size` from the shared scale and reads metrics from `controlMetrics`. No per-component heights.
- Colors from the theme; fonts from `Text`; no literals.
- Icons are Ionicons **names**, not elements.
- Solid and gradient button labels use `palette.white`.
- Disabled, pressed and border values come from the shared constants.
- Refs to React Native components use `React.ComponentRef<typeof X>`. With React Native 0.87+, `TextInput`, `View` and `Text` are function component types, so `ForwardedRef<TextInput>` no longer type-checks.
- Animations use React Native's `Animated`. `usePresence` (`hooks/core/usePresence.ts`) provides the mount and exit progress that `Modal` and `Toast` share.
- Components take data and callbacks through props and never fetch. Feature components compose primitives and may call resource hooks.
- Use `react-native-size-matters` (`scale`, `verticalScale`, `moderateScale`) for sizes that must adapt across devices.

### Overlays

- **Modal** mounts its own `ToastHost`, so toasts appear above it, and the Android back button closes it. It adds only the optional header and backdrop; the content is yours.
- **Dropdown** closes on rotation, scrolls past `maxHeight` (320) and accepts a custom `trigger` and any content.
- **Toast** is callable from anywhere (not only components): a small zustand store with at most three visible, deduplication, swipe or tap to dismiss, a countdown bar and optional `details`, `meta` and `action`.

## The Example App and the `dev` Folders

Everything that exists only to teach lives in folders named `dev`:

| Folder | Holds |
|---|---|
| `screens/dev/` | The Home and Data screens and the demo dashboard screens |
| `components/dev/` | The guide's building blocks and the live component demos |
| `lib/constants/dev/` | The guide's text (home, data, component docs) |
| `app/(dashboard)/dev/` | The demo dashboard routes |

The Home tab documents the template and the UI kit; the Data tab explains networking, mutations, auth and wiring your backend; the demo dashboard shows an infinite list, create and delete, a profile form with inline validation errors and sign-out, each naming the file it is built from.

`hooks/resources/dev` and `stores/dev` are the mock-backend implementations that a real project replaces with `prod`. They are not deleted by the strip script when something real still imports them.

### Removing the example

`npm run strip-example` deletes the example folders and every resource nothing imports afterwards, leaves a Hello world Home screen and a Hello dashboard group (`app/(dashboard)/user`), removes the Data tab and updates the guard constants and links. It prints the full plan and asks first, refuses to run unless the git working tree is clean, and type-checks before and after. See `scripts/strip-example.mjs`.

## Conventions

- Files: components and hooks camelCase, screens PascalCase, resources `Name.r.ts`.
- Imports use the `@/` alias.
- Commits are conventional (`feat:`, `fix:`, `docs:`, `chore:`).
- Run `npx tsc --noEmit` before committing.

## Quick Reference

| I want to... | Do this |
|---|---|
| Call a new endpoint | Add it to the spec, `npm run gen:api`, add a hook in a `*.r.ts` file |
| Write a mutation | `$api.useMutation(method, path, { onSuccess })`; by hand only if the hook shapes the request |
| Name a request or response type | `JsonBody`, `ResData` or `ResItem` from `api/types.ts` |
| Show a mutation error inline | `meta: { skipGlobalError: true }` and read `error.fieldErrors` |
| Toast a failed query | `meta: { reportErrors: true }` |
| Refresh data after a write | `invalidateQueries` with `$api.queryOptions(...).queryKey` |
| Store a UI toggle | A small Zustand store in `stores/` |
| Protect a screen | Place it under `(dashboard)` |
| Add a dashboard group | New folder with `_layout.tsx`, then add it to `VALID_DASHBOARD_GROUPS` |
| Add a tab | Register a screen in `app/(tabs)/_layout.tsx` with a `tabBarIcon` |
| Change the font | `theme/typography.ts`: `appFonts`, `fontFamilies`, `defaultFamily` |
| Rebrand | `theme/tokens.ts` |
| Show a message | `toast.success(...)` from anywhere |
| Remove the example app | `npm run strip-example` |