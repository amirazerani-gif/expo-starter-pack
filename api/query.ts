/**
 * api/query.ts
 * Spec-derived TanStack Query helpers, built on the app's single client
 * (api/client.ts), so the auth header, ApiError throwing and 401 handling
 * apply unchanged.
 *
 * Query keys are derived from the call, never hand-written:
 *   [method, path]          when there are no params
 *   [method, path, init]    when params are passed
 *
 * Usage (inside a resource hook):
 *   $api.queryOptions("get", "/v1/me", undefined, {
 *     select: (res) => res.data,          // strips the { message, data } envelope
 *     meta: { reportErrors: true },
 *   })
 *   $api.queryOptions("get", "/v1/items").queryKey   // key for invalidation
 *
 * Conventions:
 *  - Write `select` inline. A shared generic helper loses the response type.
 *  - Read errors as `unknown` (`const err: unknown = query.error`) and narrow
 *    with isApiError. The generated error type only covers responses the spec
 *    declares, while the runtime error is always ApiError.
 *  - A path is either a plain query or an infinite one, never both with the
 *    same params, because both share one key.
 *  - Take invalidation keys from $api.queryOptions(...), not from literals, so
 *    a spec change breaks the build instead of silently matching nothing.
 */
import createClient from "openapi-react-query";
import { client } from "./client";

export const $api = createClient(client);
