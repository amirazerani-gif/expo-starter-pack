/**
 * lib/constants/dev/dataContent.ts
 * All the text of the Data screen. Edit the strings here; the screen only
 * lays them out. Example-only: safe to delete with the rest of
 * lib/constants/dev.
 *
 * The code samples are copied from the real hooks in hooks/resources/dev.
 * When a hook changes, change its sample here.
 */
import type { IconName } from "@/components/ui/icon";

export const DATA_INTRO = {
  title: "Data and networking",
  text: "How a request travels, how mutations and auth work, what happens automatically, and how to connect your own backend.",
};

/** The request path, top to bottom. */
export const FLOW: { title: string; file: string; text: string }[] = [
  {
    title: "Screen",
    file: "screens/…",
    text: "Calls a hook and renders its data, loading and error state. No request building, no API types.",
  },
  {
    title: "Resource hook",
    file: "hooks/resources/dev/*.r.ts",
    text: "One file per resource. Owns the path, the select, the error flags and the invalidation.",
  },
  {
    title: "$api",
    file: "api/query.ts",
    text: "openapi-react-query on the client. Params, responses and cache keys are derived from the spec.",
  },
  {
    title: "Client and middleware",
    file: "api/client.ts",
    text: "One openapi-fetch client. Adds the token, throws ApiError on any non-2xx, signs out on a 401.",
  },
  {
    title: "Backend",
    file: ".env",
    text: "The mock in development, your API in production. The shapes come from the OpenAPI spec either way.",
  },
];

export const STATE_SPLIT: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "cloud-download-outline",
    title: "Server state: TanStack Query",
    text: "Anything the backend owns (items, the profile, the signed-in user). Cached and invalidated by query key. The user is server state (useMe), never copied into a store.",
  },
  {
    icon: "phone-portrait-outline",
    title: "App state: zustand",
    text: "Anything only the app knows: the session token and status, and the pending global error.",
  },
];

export type DataTopic = {
  id: string;
  title: string;
  /** One line shown under the title while collapsed. */
  summary: string;
  text: string;
  /** Short rules shown as bullets. */
  points?: string[];
  /** A code example. */
  code?: string;
  /** The file the example is taken from, or where to edit. */
  file?: string;
};

export type DataGroup = {
  id: string;
  title: string;
  text: string;
  topics: DataTopic[];
};

export const DATA_GROUPS: DataGroup[] = [
  // ─────────────────────────────────────────────────────────────
  {
    id: "reading",
    title: "Reading and writing data",
    text: "The conventions every resource hook follows.",
    topics: [
      {
        id: "queries",
        title: "Queries and keys",
        summary: "queryOptions, an inline select, never a hand-written key",
        text: "Build the options from $api, unwrap the envelope with an inline select, pass them to useQuery. The cache key is made from the method, path and request, so you never write it. Renaming a path in the spec turns every stale use into a type error.",
        points: [
          "Write select inline. A shared generic helper loses the response type.",
          "Invalidate with $api.queryOptions('get', path).queryKey, never a literal array.",
          "The list key prefix-matches the infinite list but not detail queries. Invalidate a detail explicitly.",
          "A string option that names a spec field (like pageParamName) needs a satisfies QueryParamName guard.",
        ],
        code: [
          "export const meOptions = () =>",
          '  $api.queryOptions("get", "/v1/me", undefined, {',
          "    select: (res) => res.data,",
          "    meta: { reportErrors: true },",
          "  });",
          "",
          "export function useMe() {",
          "  const status = useAuthStore((s) => s.status);",
          "  return useQuery({",
          "    ...meOptions(),",
          '    enabled: status === "authed",',
          "  });",
          "}",
        ].join("\n"),
        file: "hooks/resources/dev/User.r.ts",
      },
      {
        id: "infinite",
        title: "Infinite lists",
        summary: "Page numbers, flattened for the screen",
        text: "useInfiniteQuery with the page parameter named after the spec. The hook returns the query plus a flat items array. The mock serves one page only, so the list never loads more.",
        code: [
          "const query = $api.useInfiniteQuery(",
          '  "get", "/v1/items", {},',
          "  {",
          '    pageParamName: "page" satisfies QueryParamName<"/v1/items">,',
          "    initialPageParam: 1,",
          "    getNextPageParam: nextLaravelPage,",
          "    select: (data) => data.pages.flatMap((page) => page.data),",
          "    meta: { reportErrors: true },",
          "  },",
          ");",
          "return { ...query, items: query.data ?? NO_ITEMS };",
        ].join("\n"),
        file: "hooks/resources/dev/Items.r.ts",
      },
      {
        id: "mutations",
        title: "Mutations: two styles",
        summary:
          "Automatic by default, manual when the hook shapes the request",
        text: "Most mutations are automatic: the variables are the request itself, so $api.useMutation builds the call from the spec and you call mutate({ body, params }). onSuccess receives the whole envelope (res.data, res.message), which is where you invalidate.",
        points: [
          "Use the manual style when the hook must change the request before it is sent, or the result before it is used. Login is the case: it adds a device_name the screen should not know about, then the token goes into the auth store.",
          "Manual means a plain useMutation whose mutationFn calls client.POST and unwrap(). You keep the same typing, the same ApiError and the same global error handling.",
          "Rule of thumb: if the screen can pass the request as it is, use $api.useMutation. If the hook adds, hides or transforms something, write it by hand.",
          "Mutations never retry.",
        ],
        code: [
          "// automatic: variables are the request",
          "export function useCreateItem() {",
          "  const queryClient = useQueryClient();",
          '  return $api.useMutation("post", "/v1/items", {',
          "    onSuccess: () =>",
          "      queryClient.invalidateQueries({",
          '        queryKey: $api.queryOptions("get", "/v1/items").queryKey,',
          "      }),",
          "    meta: { skipGlobalError: true },",
          "  });",
          "}",
          "",
          "createItem.mutate({ body: { title, description: null } });",
          "",
          "// manual: the hook shapes the request",
          "export function useLogin() {",
          "  return useMutation({",
          '    mutationFn: async (body: JsonBody<"/v1/auth/login", "post">) =>',
          "      unwrap(",
          '        client.POST("/v1/auth/login", {',
          "          body: { device_name: DEVICE_NAME, ...body },",
          "        }),",
          "      ),",
          "    onSuccess: (session) =>",
          "      useAuthStore.getState().setSession(session.token),",
          "    meta: { skipGlobalError: true },",
          "  });",
          "}",
        ].join("\n"),
        file: "hooks/resources/dev/Items.r.ts, Auth.r.ts",
      },
      {
        id: "delete",
        title: "Deleting by id",
        summary: "The id goes at the call site",
        text: "A hook that targets one record does not take the id as an argument. The screen passes it in the path params when it calls mutate, so one hook serves every row. After the delete, the hook drops that item's cached detail instead of refetching it, which would 404, and refreshes the list.",
        code: [
          "export function useDeleteItem() {",
          "  const queryClient = useQueryClient();",
          '  return $api.useMutation("delete", "/v1/items/{item}", {',
          "    onSuccess: (_res, variables) => {",
          "      queryClient.removeQueries({",
          "        queryKey: itemOptions(variables.params.path.item).queryKey,",
          "      });",
          "      return queryClient.invalidateQueries({",
          '        queryKey: $api.queryOptions("get", "/v1/items").queryKey,',
          "      });",
          "    },",
          "  });",
          "}",
          "",
          "deleteItem.mutate({ params: { path: { item: item.id } } });",
        ].join("\n"),
        file: "hooks/resources/dev/Items.r.ts, screens/dev/dashboard/DashboardItemsScreen.tsx",
      },
      {
        id: "uploads",
        title: "File uploads",
        summary: "multipart() builds the form body",
        text: "Wrap the file in multipart() and the client sends multipart/form-data. The file is { uri, name, type }, which is what an image picker returns. The template has no upload demo and no picker, because picking a file needs a package your app adds itself. The hook below is the pattern for an upload endpoint in your spec. Checked against the library and the types, not on a physical device.",
        code: [
          "export function useUploadAvatar() {",
          "  const queryClient = useQueryClient();",
          '  return $api.useMutation("post", "/v1/me/avatar", {',
          "    onSuccess: () =>",
          "      queryClient.invalidateQueries({ queryKey: meOptions().queryKey }),",
          "  });",
          "}",
          "",
          "upload.mutate(multipart({ avatar: { uri, name, type } }));",
          "upload.mutate({ params, ...multipart({ avatar: file }) });",
        ].join("\n"),
        file: "api/client.ts",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: "auth",
    title: "Auth and protected screens",
    text: "How the session works and how it drives navigation.",
    topics: [
      {
        id: "token",
        title: "The token and the session",
        summary: "SecureStore, a status, and three actions",
        text: "The auth store keeps the bearer token in SecureStore, so it survives restarts and is stored encrypted by the OS. Its status is loading while the token is being read at launch, then authed or guest.",
        points: [
          "hydrate() reads the token on launch. setSession(token) runs after a successful login. clearSession() removes the token.",
          "The client middleware reads the token from the store and adds the Authorization header to every request.",
          "The signed-in user is not in the store. Fetch it with useMe.",
          "Login stores the session in the manual useLogin hook; logout calls the API, then clears the session even if the request fails.",
        ],
        file: "stores/dev/auth.store.ts",
      },
      {
        id: "guard",
        title: "The protected stack",
        summary: "app/(dashboard)/_layout.tsx redirects by session status",
        text: "Everything under app/(dashboard) is protected by its layout. The layout reads the session status and redirects, so screens inside never check whether the user is signed in.",
        points: [
          "Guest: redirected to /(auth)/login.",
          "Signed in but outside a known group: redirected to the default group.",
          "VALID_DASHBOARD_GROUPS and DEFAULT_GROUP in that layout list your dashboard groups. Add a folder, add its name there.",
          "The login screen navigates into the dashboard once the status is authed. Logout clears the session and the guard sends the user back.",
        ],
        file: "app/(dashboard)/_layout.tsx",
      },
      {
        id: "role",
        title: "Role-based navigation",
        summary: "A pattern, not wired code",
        text: "The demo user has no roles. If yours does, filter the menu from server state, and guard the group as well.",
        code: [
          "type NavItem = { label: string; href: Href; roles?: string[] };",
          "",
          "const NAV: NavItem[] = [",
          '  { label: "Items", href: "/(dashboard)/dev/items" },',
          '  { label: "Users", href: "/(dashboard)/admin", roles: ["admin"] },',
          "];",
          "",
          "const { data: me } = useMe();",
          "const visible = NAV.filter(",
          "  (i) => !i.roles || (me && i.roles.includes(me.role)),",
          ");",
          "",
          "// Hiding a link is not security. Also redirect in the",
          "// group's _layout.tsx and enforce the role on the server.",
        ].join("\n"),
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: "automatic",
    title: "What happens automatically",
    text: "Behavior you get without writing code.",
    topics: [
      {
        id: "signout",
        title: "Automatic sign-out",
        summary: "A 401 with a token ends the session",
        text: "When a request that carried a token comes back 401, the middleware calls clearSession(). The status becomes guest, in-flight queries are cancelled, the cache is cleared and the dashboard guard redirects to login. A wrong password on the login request does not trigger it, because that request carried no token.",
        points: [
          "Only a 401 signs out. A 403 or a 404 is an ordinary error.",
          "Change the rule in the 401 branch of the middleware in api/client.ts.",
        ],
        file: "api/client.ts",
      },
      {
        id: "errors",
        title: "Global error handling",
        summary: "Failures become one toast, flags opt out",
        text: "Every non-2xx becomes an ApiError. A failing request is parsed into the error store (message, status, remaining validation errors), and ErrorToastListener, mounted in the root layout next to ToastHost, shows it as one toast and clears it. You write nothing for the default case.",
        points: [
          "Queries are silent unless meta: { reportErrors: true }.",
          "Mutations toast unless meta: { skipGlobalError: true }. Use it when the screen shows the error inline.",
          "skipGlobalError only covers 4xx. A 5xx or a network failure always toasts.",
          "Titles and durations per status live in ERROR_CONFIG in hooks/core/useErrorListener.ts.",
          "A hook's error is typed from the spec and may be never. Read it as unknown and narrow with isApiError.",
        ],
        file: "stores/core/error.store.ts, hooks/core/useErrorListener.ts",
      },
      {
        id: "inline",
        title: "Inline validation errors",
        summary: "A form reads error.fieldErrors",
        text: "A form's mutation sets skipGlobalError, so a 4xx is not toasted. The screen narrows the error and shows the first message per field under each input. Anything that is not a field error, such as a 4xx without an errors map, shows as one message under the form.",
        code: [
          "const { mutate, error } = useUpdateMe(); // skipGlobalError",
          "",
          "const failure: unknown = error;",
          "const inline =",
          "  isApiError(failure) && failure.status < 500 ? failure : null;",
          "const fields = inline?.fieldErrors ?? {};",
          "",
          '<Input label="Name" error={fields.name} />',
        ].join("\n"),
        file: "screens/dev/dashboard/DashboardProfileScreen.tsx, api/errors.ts",
      },
      {
        id: "retries",
        title: "Retries and offline",
        summary: "Short drops are absorbed",
        text: "Queries retry 5xx and network failures twice, never 4xx, so a brief outage resolves before any toast. The root layout watches connectivity and redirects to /no-internet when the device is offline. The retry rules live in lib/queryClient.ts.",
        file: "lib/queryClient.ts, app/_layout.tsx",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: "backend",
    title: "Connecting your backend",
    text: "The mock is a stand-in. Here is how to replace it.",
    topics: [
      {
        id: "mock",
        title: "The mock backend",
        summary: "Prism, serving openapi/openapi.yaml",
        text: "npm run mock serves the demo contract on port 4010, so the app works before you have a server. Any credentials sign in. The spec is the single source of truth: it describes the endpoints, and the app's types come from it.",
        points: [
          "The mock is stateless. Created, edited and deleted data is not kept, so watch the requests in the Prism terminal instead.",
          "Prism answers with the examples in the spec. To get a declared status, send a Prefer: code=422 header; the profile demo does this on its second button.",
          "A status the operation does not declare returns a 404 from Prism.",
          "Restart the mock after editing the spec, then run npm run gen:api.",
        ],
        code: "npm run mock",
      },
      {
        id: "wire",
        title: "Wire in your API",
        summary: "Env, spec, generate, fix the type errors",
        text: "The types are generated from your backend's OpenAPI spec into api/schema.d.ts. Do not edit that file.",
        points: [
          "1. In .env set the API host (EXPO_PUBLIC_API_DEV_URL for development, EXPO_PUBLIC_API_BASE_URL for production). On a physical phone use your machine's LAN IP, not localhost.",
          "2. Set OPENAPI_URL in .env to your spec URL, or replace openapi/openapi.yaml with your spec file.",
          "3. Run npm run gen:api. It rewrites api/schema.d.ts.",
          "4. Run npx tsc. Every call that no longer matches your spec is now a type error. Fix the resource hooks one by one.",
          "5. Write your resources in hooks/resources/prod, following the dev examples, and delete the demo ones.",
          "6. Restart Metro with npx expo start -c, since env values are read at build time.",
        ],
        code: [
          "EXPO_PUBLIC_API_DEV_URL=http://192.168.1.20:8000",
          "OPENAPI_URL=http://192.168.1.20:8000/docs/openapi.json",
          "",
          "npm run gen:api",
          "npx tsc",
        ].join("\n"),
        file: ".env, scripts/gen-api.mjs",
      },
      {
        id: "differs",
        title: "If your backend differs",
        summary: "Each assumption lives in one file",
        text: "The demo backend is Laravel-style. If yours is not, change the matching file, not every hook.",
        points: [
          "Response envelope { message, data }: the select in each hook and unwrap in api/client.ts.",
          "Pagination (page numbers, meta.last_page): api/pagination.ts. Cursor or offset paging means a new getNextPageParam.",
          "Validation errors (422 with an errors map): ErrorBody and fieldErrors in api/errors.ts.",
          "Auth header and the sign-out status: the middleware in api/client.ts.",
          "What login returns and how the token is read: the login hook and stores/dev/auth.store.ts.",
          "Toast titles per status: ERROR_CONFIG in hooks/core/useErrorListener.ts.",
        ],
      },
    ],
  },
];

export const DATA_END = {
  title: "See it working",
  text: "The demo dashboard runs these patterns against the mock: an infinite list, create and delete, and a profile form with inline errors.",
};
