/**
 * api/pagination.ts
 * Paging for infinite lists, for standard Laravel page-number pagination
 * (`data` plus `meta.current_page` / `meta.last_page`).
 *
 *   nextLaravelPage  getNextPageParam for $api.useInfiniteQuery
 *
 * Usage (see hooks/resources/dev/Items.r.ts):
 *   $api.useInfiniteQuery("get", "/v1/items", {}, {
 *     pageParamName: "page",
 *     initialPageParam: 1,
 *     getNextPageParam: nextLaravelPage,
 *     select: (data) => data.pages.flatMap((page) => page.data),
 *   });
 *
 * If your API pages differently (cursor, offset...), change this file and
 * the pageParamName; it is the only place that knows the paging shape.
 */
export function nextLaravelPage(last: {
  meta: { current_page: number; last_page: number };
}): number | undefined {
  const { current_page, last_page } = last.meta;
  return current_page < last_page ? current_page + 1 : undefined;
}
