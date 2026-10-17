/**
 * api/pagination.ts
 * Pagination helpers for infinite lists, for standard Laravel page-number
 * pagination (`data` plus `meta.current_page` / `meta.last_page`).
 *
 *   unwrapPage  turns one response into { items, nextPage }
 *   flatPages   flattens an infinite query's pages into a single array
 *
 * Usage (see hooks/resources/dev/Items.r.ts):
 *   queryFn: ({ pageParam }) => unwrapPage(client.GET("/v1/items", ...))
 *   getNextPageParam: (last) => last.nextPage ?? undefined
 *
 * If your API pages differently (cursor, offset...), change this file; it is
 * the only place that knows the paging shape.
 */
type LaravelPage<T> = {
  data: T[];
  meta: { current_page: number; last_page: number };
};

export async function unwrapPage<T>(
  request: Promise<{ data?: LaravelPage<T> }>,
) {
  const body = (await request).data as LaravelPage<T>;
  const { current_page, last_page } = body.meta;
  return {
    items: body.data,
    nextPage: current_page < last_page ? current_page + 1 : null,
  };
}

export const flatPages = <T>(data?: { pages: { items: T[] }[] }): T[] =>
  data?.pages.flatMap((page) => page.items) ?? [];
