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
import { nextLaravelPage } from "@/api/pagination";
import { $api } from "@/api/query";
import type { ResData, ResItem } from "@/api/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  return $api.useMutation("post", "/v1/items", {
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/v1/items").queryKey,
      }),
    meta: { skipGlobalError: true },
  });
}

/** The item id goes at the call site: mutate({ params: { path: { item: id } }, body }). */
export function useUpdateItem() {
  const queryClient = useQueryClient();
  return $api.useMutation("put", "/v1/items/{item}", {
    // Refreshes both the list and this item's detail.
    onSuccess: (_res, variables) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: $api.queryOptions("get", "/v1/items").queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: itemOptions(variables.params.path.item).queryKey,
        }),
      ]),
    meta: { skipGlobalError: true },
  });
}

/** mutate({ params: { path: { item: id } } }) */
export function useDeleteItem() {
  const queryClient = useQueryClient();
  return $api.useMutation("delete", "/v1/items/{item}", {
    onSuccess: (_res, variables) => {
      // The deleted detail is dropped rather than refetched, which would 404.
      queryClient.removeQueries({
        queryKey: itemOptions(variables.params.path.item).queryKey,
      });
      return queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/v1/items").queryKey,
      });
    },
  });
}