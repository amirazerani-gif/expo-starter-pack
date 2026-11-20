/**
 * hooks/resources/dev/Items.r.ts
 * Worked example of a resource: one file per API resource, holding its types,
 * query options, and query and mutation hooks. Copy this file as the
 * starting point for a new resource.
 *
 *   Keys          derived from method + path by $api, never hand-written.
 *                 Invalidate with $api.queryOptions("get", "/v1/items").queryKey:
 *                 it prefix-matches the list, and a spec change breaks the build.
 *   Options       itemOptions can be reused outside hooks (prefetching,
 *                 route loaders, queryClient.fetchQuery).
 *   Pagination    useItems() flattens an infinite list through `select`.
 *                 A path is either plain or infinite, never both with the
 *                 same params, because both share one key.
 *   Mutations     invalidate affected queries instead of editing the cache.
 *
 * Usage:
 *   const { items, fetchNextPage, hasNextPage } = useItems();
 *   const { mutate: createItem } = useCreateItem();
 */
import { client, unwrap, unwrapMessage } from "@/api/client";
import { nextLaravelPage } from "@/api/pagination";
import { $api } from "@/api/query";
import type { JsonBody, ResData, ResItem } from "@/api/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Item = ResItem<"/v1/items">;
export type ItemDetail = ResData<"/v1/items/{item}">;

const NO_ITEMS: Item[] = [];

/** Infinite list with every loaded page flattened into `items`. */
export function useItems() {
  const query = $api.useInfiniteQuery(
    "get",
    "/v1/items",
    {},
    {
      pageParamName: "page",
      initialPageParam: 1,
      getNextPageParam: nextLaravelPage,
      select: (data) => data.pages.flatMap((page) => page.data),
      meta: { reportErrors: true },
    },
  );
  return { ...query, items: query.data ?? NO_ITEMS };
}

export const itemOptions = (id: number) =>
  $api.queryOptions(
    "get",
    "/v1/items/{item}",
    { params: { path: { item: id } } },
    { select: (res) => res.data, meta: { reportErrors: true } },
  );

/** One item. Stays idle until `id` is defined. */
export function useItem(id: number | undefined) {
  return useQuery({ ...itemOptions(id ?? 0), enabled: id != null });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: JsonBody<"/v1/items", "post">) =>
      unwrap(client.POST("/v1/items", { body })),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/v1/items").queryKey,
      }),
    meta: { skipGlobalError: true },
  });
}

export function useUpdateItem(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: JsonBody<"/v1/items/{item}", "put">) =>
      unwrap(
        client.PUT("/v1/items/{item}", {
          params: { path: { item: id } },
          body,
        }),
      ),
    // Refreshes both the list and this item's detail.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: $api.queryOptions("get", "/v1/items").queryKey,
        }),
        queryClient.invalidateQueries({ queryKey: itemOptions(id).queryKey }),
      ]),
    meta: { skipGlobalError: true },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      unwrapMessage(
        client.DELETE("/v1/items/{item}", { params: { path: { item: id } } }),
      ),
    onSuccess: (_msg, id) => {
      // The deleted detail is dropped rather than refetched, which would 404.
      queryClient.removeQueries({ queryKey: itemOptions(id).queryKey });
      return queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/v1/items").queryKey,
      });
    },
  });
}
