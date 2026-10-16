/**
 * api/pagination.ts
 * Standard Laravel page-number pagination: each list response carries
 * `data` plus `meta.current_page` / `meta.last_page`. unwrapPage turns that
 * into { items, nextPage } so infinite-query hooks stay one-liners.
 *
 * If your API pages differently (cursor, offset...), change this file —
 * it is the only place that knows the paging shape.
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

/** Flattens an infinite query's pages into one list. */
export const flatPages = <T>(data?: { pages: { items: T[] }[] }): T[] =>
  data?.pages.flatMap((page) => page.items) ?? [];
