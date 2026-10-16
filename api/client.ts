/**
 * api/client.ts
 * The single openapi-fetch instance. Handles, once, for every request:
 *  - Authorization header from the auth store
 *  - Accept: application/json (Laravel returns JSON errors instead of redirects)
 *  - logging + throwing ApiError on any non-2xx response
 *  - clearing the session on 401
 * Resource hooks never see an `error` branch: failures throw.
 *
 * EXPO_PUBLIC_IS_TESTING=true  -> EXPO_PUBLIC_API_DEV_URL  (mock server / staging)
 * EXPO_PUBLIC_IS_TESTING=false -> EXPO_PUBLIC_API_BASE_URL (your real backend)
 */
import { useAuthStore } from "@/stores/prod/auth.store";
import createClient, { type Middleware } from "openapi-fetch";
import { ApiError, type ErrorBody } from "./errors";
import type { paths } from "./schema";

const isTesting = process.env.EXPO_PUBLIC_IS_TESTING === "true";
const baseUrl = isTesting
  ? process.env.EXPO_PUBLIC_API_DEV_URL
  : process.env.EXPO_PUBLIC_API_BASE_URL;

if (!baseUrl) {
  throw new Error("API base URL is missing — check your .env");
}
if (__DEV__) {
  console.log(`[API] ${isTesting ? "TEST" : "PROD"} base URL: ${baseUrl}`);
}

const middleware: Middleware = {
  onRequest({ request }) {
    const token = useAuthStore.getState().token;
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },

  async onResponse({ request, response }) {
    if (response.ok) return;

    const body = (await response
      .clone()
      .json()
      .catch(() => null)) as ErrorBody | null;
    const method = request.method.toUpperCase();
    const path = new URL(request.url).pathname;

    console.error(`[API ERROR] ${method} ${path} | ${response.status}`, body);

    // Only react to 401s on requests that carried a token (a wrong-password
    // login must not look like an expired session).
    if (response.status === 401 && request.headers.has("Authorization")) {
      void useAuthStore.getState().clearSession();
    }

    throw new ApiError(response.status, body, method, path);
  },

  onError({ error, request }) {
    // Network failure / abort: fetch itself threw. Log, then rethrow as-is.
    console.error(
      `[API NETWORK ERROR] ${request.method} ${request.url}`,
      error,
    );
  },
};

export const client = createClient<paths>({
  baseUrl,
  headers: { Accept: "application/json" },
});
client.use(middleware);

/**
 * Failures already threw inside the middleware, so on this path `data` is
 * always present. Unwraps Laravel's { message, data } envelope so
 * components never see it.
 */
export async function unwrap<T>(
  request: Promise<{ data?: { data: T } }>,
): Promise<T> {
  const { data } = await request;
  return (data as { data: T }).data;
}

/**
 * For endpoints that return no payload (logout, change password, ...):
 * resolves with the server's message, handy for a toast.
 */
export async function unwrapMessage(
  request: Promise<{ data?: { message?: string | null } }>,
): Promise<string> {
  const { data } = await request;
  return data?.message ?? "";
}

/**
 * Multipart upload helper. The generated type for a file field is `string`,
 * which a React Native file object ({ uri, name, type }) is not, so the
 * typed body is bypassed and the FormData is built here.
 *
 *   client.POST("/v1/me/avatar", multipart({ avatar: file }))
 */
export type RNFile = { uri: string; name: string; type: string };

export function multipart(
  fields: Record<string, RNFile | string | number | boolean | null | undefined>,
) {
  return {
    body: {} as never,
    bodySerializer: () => {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) {
        if (value == null) continue;
        // RN's FormData accepts { uri, name, type } as a file part
        form.append(
          key,
          typeof value === "object" ? (value as any) : String(value),
        );
      }
      return form;
    },
  };
}
