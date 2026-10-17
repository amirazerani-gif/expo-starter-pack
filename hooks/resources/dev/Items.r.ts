/**
 * hooks/resources/dev/Items.r.ts
 * Worked example of a resource: one file per API resource, holding its types,
 * key factory, query options, and query and mutation hooks. Copy this file
 * as the starting point for a new resource.
 *
 *   Key factory   itemKeys is the single source of cache keys, so
 *                 invalidation never relies on hand-typed arrays.
 *   Options       itemsOptions / itemOptions can be reused outside hooks
 *                 (prefetching, route loaders, queryClient.fetchQuery).
 *   Pagination    useItems() flattens an infinite list through unwrapPage.
 *   Mutations     create / update / delete invalidate affected queries
 *                 instead of editing the cache by hand.
 *
 * Usage:
 *   const { items, fetchNextPage, hasNextPage } = useItems();
 *   const { mutate: createItem } = useCreateItem();
 */
import { client, unwrap, unwrapMessage } from "@/api/client";
import { flatPages, unwrapPage } from "@/api/pagination";
import type { JsonBody, ResData, ResItem } from "@/api/types";
import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type Item = ResItem<"/v1/items">;
export type ItemDetail = ResData<"/v1/items/{item}">;

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  detail: (id: number) => [...itemKeys.all, "detail", id] as const,
};

export const itemsOptions = () =>
  infiniteQueryOptions({
    queryKey: itemKeys.lists(),
    queryFn: ({ pageParam, signal }) =>
      unwrapPage(
        client.GET("/v1/items", {
          params: { query: { page: pageParam } },
          signal,
        }),
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    meta: { reportErrors: true },
  });

export const itemOptions = (id: number) =>
  queryOptions({
    queryKey: itemKeys.detail(id),
    queryFn: ({ signal }) =>
      unwrap(
        client.GET("/v1/items/{item}", {
          params: { path: { item: id } },
          signal,
        }),
      ),
    meta: { reportErrors: true },
  });

/** Infinite list with every loaded page flattened into `items`. */
export function useItems() {
  const query = useInfiniteQuery(itemsOptions());
  return { ...query, items: flatPages(query.data) };
}

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
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() }),
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
    // Refreshes both the list and the detail.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemKeys.all }),
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
      queryClient.removeQueries({ queryKey: itemKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}
