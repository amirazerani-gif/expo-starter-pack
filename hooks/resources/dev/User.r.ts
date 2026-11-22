/**
 * hooks/resources/dev/User.r.ts
 * The signed-in user ("me"). This is server state, so it lives in TanStack
 * Query rather than in the auth store.
 *
 *   useMe()            the current user; only runs while authenticated
 *   useUpdateMe()      partial profile update; refreshes useMe() on success
 *
 * Usage:
 *   const { data: me, isLoading } = useMe();
 *   const { mutate } = useUpdateMe();
 *   mutate({ body: { name: "New name" } });
 *
 * useUpdateMe sets `skipGlobalError` because it feeds a form with inline
 * errors. useMe sets `reportErrors` because a failed fetch has no form to
 * report into and should be visible.
 */
import { $api } from "@/api/query";
import { useAuthStore } from "@/stores/dev/auth.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  return $api.useMutation("patch", "/v1/me", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: meOptions().queryKey }),
    meta: { skipGlobalError: true },
  });
}
