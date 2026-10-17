# Architecture

How the template is organized and why. Read this before adding features; it keeps every project built from the template consistent.

## The Rules

1. **Types come from the schema.** Request and response types are generated from the OpenAPI spec (`api/schema.d.ts`) and named through helpers in `api/types.ts`. Never hand-write an API type.
2. **Server data lives in TanStack Query.** Anything that comes from, or is saved to, the backend (the user, lists, details) is server state. It is cached, expired and refetched by TanStack Query, and never copied into a store.
3. **Zustand is for app and UI state only.** The auth token, the current error toast and UI toggles (a drawer, a theme choice) belong in stores. If it came from the API, it does not.
4. **One resource, one file.** Each API resource has a single hooks file with its types, cache keys, query options and hooks. Components never call the client directly.
5. **Components stay thin.** Screens call resource hooks and render. No `fetch`, no cache keys, no envelope handling in UI code.
6. **Mutations invalidate; they do not patch the cache.** After a write, invalidate the affected keys and let the refetch bring the truth.
7. **Failures throw.** The client throws an `ApiError` for any non-2xx response, so hooks never branch on an `error` field.

## How Data Flows

```
Screen ──calls──▶ resource hook (hooks/resources/*.r.ts)
                       │  useQuery / useMutation
                       ▼
                  api/client.ts  (openapi-fetch + middleware)
                       │  adds token, throws ApiError on non-2xx
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
| App state | Zustand (`stores/`) | auth token and status, error toast |
| UI state | Zustand or `useState` | open drawer, selected filter |
| Form state | `react-hook-form` or `useState` | input values, field errors |

## The API Layer (`api/`)

### `client.ts`

The single `openapi-fetch` instance. Its middleware:

- attaches `Authorization: Bearer <token>` from the auth store
- logs failures and throws an `ApiError` for every non-2xx response
- ends the session when an *authenticated* request returns 401 (a wrong-password login does not count, because it carries no token)
- logs network failures and lets them propagate

The base URL is chosen by `EXPO_PUBLIC_IS_TESTING`: `true` uses `EXPO_PUBLIC_API_DEV_URL`, `false` uses `EXPO_PUBLIC_API_BASE_URL`.

### Unwrappers

Because failures throw, a resolved call always has data. Unwrappers strip the response envelope so components never see it:

| Helper | Returns | Use for |
|---|---|---|
| `unwrap(call)` | the envelope's `data` | most reads and writes |
| `unwrapMessage(call)` | the envelope's `message` string | endpoints with no payload (logout, change password) |
| `unwrapPage(call)` | `{ items, nextPage }` | paginated lists |
| `flatPages(data)` | one array | flattening an infinite query's pages |
| `multipart(fields)` | request options | file uploads: `client.POST(path, multipart({ avatar: file }))` |

```ts
unwrap(client.GET("/v1/items/{item}", { params: { path: { item: 1 } } }));
```

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

Handles standard Laravel page-number pagination (`meta.current_page` and `meta.last_page`). For cursor or offset pagination, edit this file. It is the only place that knows the paging shape, so resource hooks do not change.

## Resources (`hooks/resources/`)

A resource file is named in PascalCase with the `.r.ts` suffix (`Items.r.ts`) and contains, in order:

1. **Types** derived from the schema (`export type Item = ResItem<"/v1/items">`)
2. **A key factory** (`itemKeys`), the single source of cache keys
3. **Query options** (`itemsOptions`, `itemOptions`), reusable for prefetching
4. **Hooks** wrapping the options (`useItems`, `useItem`)
5. **Mutation hooks** (`useCreateItem`, ...) that invalidate on success

`dev/` holds resources for the mock backend; `prod/` is where your real resources go. `Items.r.ts` is the worked example: copy it.

### Adding a Resource

1. Make sure the endpoint is in your spec and run `npm run gen:api`.
2. Create `hooks/resources/prod/Posts.r.ts`:

```ts
import { client, unwrap } from "@/api/client";
import type { ResData } from "@/api/types";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Post = ResData<"/v1/posts/{post}">;

export const postKeys = {
  all: ["posts"] as const,
  detail: (id: number) => [...postKeys.all, "detail", id] as const,
};

export const postOptions = (id: number) =>
  queryOptions({
    queryKey: postKeys.detail(id),
    queryFn: ({ signal }) =>
      unwrap(client.GET("/v1/posts/{post}", { params: { path: { post: id } }, signal })),
    meta: { reportErrors: true },
  });

export const usePost = (id: number | undefined) =>
  useQuery({ ...postOptions(id ?? 0), enabled: id != null });
```

3. Use it in a screen: `const { data: post, isLoading } = usePost(id);`

Always pass `signal` into the client call so cancelled queries abort the request. For lists use `infiniteQueryOptions` and `unwrapPage`, as in `Items.r.ts`. For writes, call `invalidateQueries` on the affected keys in `onSuccess`.

## Error Handling

### The flags

Two typed `meta` flags control whether a failure becomes a global toast or is left to the screen:

| Flag | On | Effect |
|---|---|---|
| `meta: { reportErrors: true }` | queries | Toast when this query fails. Queries are **silent by default**, so a background refetch never interrupts the user. |
| `meta: { skipGlobalError: true }` | mutations | Skip the toast for 4xx errors, because the screen shows them inline. Mutations **toast by default**. |

`skipGlobalError` only covers 4xx. A 5xx or a network failure on a mutation always toasts, since nothing inline can handle it.

Choosing a flag:

- Mutation behind a form (login, update profile): `skipGlobalError`, and show `error.fieldErrors` or `error.message` inline.
- Mutation with no form (logout, delete, a "resend" button): no flag, so the toast is the feedback.
- Query whose failure matters (a detail screen with no cached fallback): `reportErrors`.
- Background or secondary query: no flag.

### Showing an error inline

```tsx
const { mutate, error } = useLogin();
const inline = isApiError(error) && error.status < 500 ? error : null;
// inline?.fieldErrors.login, inline?.message
```

### The pipeline

1. `api/client.ts` throws an `ApiError` (or fetch throws a network `TypeError`).
2. The `QueryCache` / `MutationCache` in `lib/queryClient.ts` applies the flag rules.
3. If the error should surface, it calls `useErrorStore.getState().reportError(error)`.
4. `stores/core/error.store.ts` classifies it (validation, auth, forbidden, not found, server, network, unknown), logs it and publishes it. Cancelled requests are ignored.
5. `ErrorToastListener` (mounted in the root layout) shows the toast. To change a toast's title or emoji, edit `ERROR_CONFIG` in `hooks/core/useErrorListener.ts`.

`useErrorStore.getState().showError(error)` does the same as `reportError` and then rethrows, for the rare call site that wants to surface an error and still propagate it.

### Retries and connectivity

Queries retry twice on 5xx and network failures and never on 4xx; mutations never retry, so a form cannot be silently submitted twice. Requests pause while offline and resume on reconnect, and the app returns to the last screen after the `/no-internet` screen.

## Auth

### The store (`stores/dev/auth.store.ts`)

Owns client state only: `token` and `status` (`loading`, `authed` or `guest`), plus `hydrate()`, `setSession(token)` and `clearSession()`. The token is persisted in SecureStore. The user object is **not** here; it is server state in `useMe()`.

### The flow

1. **Boot.** The root layout calls `hydrate()` and holds the splash screen until fonts are loaded and the status is no longer `loading`. Guards therefore only ever see `authed` or `guest`.
2. **Sign in.** `useLogin()` calls the endpoint and, on success, runs `setSession(token)`. The login screen navigates when the status becomes `authed`.
3. **Requests.** The client middleware reads the token on every request.
4. **Sign out.** `useLogout()` calls the endpoint and clears the session even if the request fails.
5. **Expired token.** A 401 on an authenticated request clears the session.
6. **Cleanup.** When the status becomes `guest` for any reason, `lib/queryClient.ts` cancels in-flight queries and clears the cache, so no data leaks to the next user.
7. **Redirect.** The dashboard guard sees `guest` and returns the user to login. No extra code is needed in the logout button.

### Switching to a real backend

Create `stores/prod/auth.store.ts` and update the imports (listed in the README). Resource hooks for auth should live in `hooks/resources/prod/`.

## Routes and Screens

### Convention

`app/` holds **route files only**: layouts, guards and thin route files. Screen implementations live in `screens/` and are rendered by the route:

```tsx
// app/(dashboard)/user/index.tsx
export { default } from "@/screens/dashboard/UserHomeScreen";
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

The template does no role branching, because a role is server state, not auth state. If your backend has roles, read the role from `useMe()` in the guard and redirect to the matching group.

### Adding a screen

1. Build it in `screens/<area>/<Name>Screen.tsx`, using resource hooks and UI primitives.
2. Add a route file that re-exports it from the right group.
3. For a new top-level group, register it in `app/_layout.tsx` as a `<Stack.Screen />`.

## Components and Theme

- **UI primitives** (`components/ui/`): `Text`, `Input`, `TextArea`, `Button` and `SectionCard`. The showcase screen renders every variant.
- **Theme** (`theme/`): tokens for color, spacing and radius with automatic dark/light mode. Read them with `useTheme()` and never hard-code colors in screens. Update the tokens to rebrand the app.
- **Scaling**: use `react-native-size-matters` (`scale`, `verticalScale`, `moderateScale`) for sizes that must adapt across devices.
- **Component rules**: primitives take data and callbacks through props and never fetch. Feature components compose primitives and may call resource hooks.

## Quick Reference

| I want to... | Do this |
|---|---|
| Call a new endpoint | Add it to the spec, `npm run gen:api`, add a hook in a `*.r.ts` file |
| Name a request or response type | `JsonBody`, `ResData` or `ResItem` from `api/types.ts` |
| Show a mutation error inline | `meta: { skipGlobalError: true }` and read `error.fieldErrors` |
| Toast a failed query | `meta: { reportErrors: true }` |
| Refresh data after a write | `invalidateQueries` with the key factory |
| Store a UI toggle | A small Zustand store in `stores/` |
| Protect a screen | Place it under `(dashboard)` |