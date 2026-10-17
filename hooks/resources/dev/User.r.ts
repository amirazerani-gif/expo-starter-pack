/**
 * hooks/resources/dev/User.r.ts
 * The signed-in user ("me"). This is server state, so it lives in TanStack
 * Query rather than in the auth store.
 *
 *   useMe()        the current user; only runs while authenticated
 *   useUpdateMe()  partial profile update; refreshes useMe() on success
 *
 * Usage:
 *   const { data: me, isLoading } = useMe();
 *
 * useUpdateMe sets `skipGlobalError` because it feeds a form with inline
 * errors. useMe sets `reportErrors` because a failed fetch has no form to
 * report into and should be visible.
 */
import { client, unwrap } from "@/api/client";
import type { JsonBody } from "@/api/types";
import { useAuthStore } from "@/stores/dev/auth.store";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const userKeys = {
  all: ["user"] as const,
  me: () => [...userKeys.all, "me"] as const,
};

export const meOptions = () =>
  queryOptions({
    queryKey: userKeys.me(),
    queryFn: ({ signal }) => unwrap(client.GET("/v1/me", { signal })),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.me() }),
    meta: { skipGlobalError: true },
  });
}
