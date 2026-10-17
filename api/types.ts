/**
 * api/types.ts
 * Type helpers that name request and response shapes straight from the
 * generated schema, so no type is ever written by hand.
 *
 *   JsonBody<"/v1/auth/login", "post">   request body of an endpoint
 *   ResData<"/v1/items/{item}">          `data` of a 200 response
 *   ResItem<"/v1/items">                 one element of a list response
 *
 * The method argument defaults to "get". Regenerate the schema with
 * `npm run gen:api` and these types follow automatically.
 */
import type { paths } from "./schema";

export type JsonBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends {
  requestBody?: { content: { "application/json": infer B } };
}
  ? B
  : never;

export type ResData<
  P extends keyof paths,
  M extends keyof paths[P] = "get" & keyof paths[P],
> = paths[P][M] extends {
  responses: { 200: { content: { "application/json": { data: infer D } } } };
}
  ? D
  : never;

export type ResItem<
  P extends keyof paths,
  M extends keyof paths[P] = "get" & keyof paths[P],
> = ResData<P, M> extends (infer I)[] ? I : never;
