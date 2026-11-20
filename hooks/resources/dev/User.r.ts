/**
 * hooks/resources/dev/User.r.ts
 * The signed-in user ("me"). This is server state, so it lives in TanStack
 * Query rather than in the auth store.
 *
 *   useMe()        the current user; only runs while authenticated
 *   useUpdateMe()  partial profile update; refreshes useMe() on success
 *
 * The query key comes from $api (api/query.ts), derived from method and
 * path, so there is no key factory to maintain.
 *
 * useUpdateMe sets `skipGlobalError` because it feeds a form with inline
 * errors. useMe sets `reportErrors` because a failed fetch has no form to
 * report into and should be visible.
 */
import { client, unwrap } from "@/api/client";
import { $api } from "@/api/query";
import type { JsonBody } from "@/api/types";
import { useAuthStore } from "@/stores/dev/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const meOptions = () =>
  $api.queryOptions("get", "/v1/me", undefined, {
    select: (res) => res.data, // strips the { message, data } envelope
    meta: { reportErrors: true },
  });

export function useMe() {
  const status = useAuthStore((s) => s.status);
  return useQuery({ ...meOptions(), enabled: status === "authed" });
}

/** Send only the fields that changed. */
export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: JsonBody<"/v1/me", "patch">) =>
      unwrap(client.PATCH("/v1/me", { body })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: meOptions().queryKey }),
    meta: { skipGlobalError: true },
  });
}
