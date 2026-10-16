/**
 * api/types.ts
 * Helpers to name request/response types straight from the generated schema.
 *   JsonBody<"/v1/auth/login", "post">   request body
 *   ResData<"/v1/items/{item}">          the `data` of a 200 response
 *   ResItem<"/v1/items">                 one element of a list response
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
