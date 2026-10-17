/**
 * hooks/resources/dev/Auth.r.ts
 * Auth resource for the mock backend: login and logout.
 *
 * Hooks own the endpoint call and the side effects that must always happen
 * (starting or ending the session). Screen-specific effects (navigation,
 * toasts, form errors) belong at the call site:
 *   login(values, { onSuccess, onError })
 *
 * Error handling: useLogin sets `skipGlobalError` because the login form
 * shows 4xx errors inline. Logout has no form, so it uses the default toast.
 * 5xx and network failures always toast.
 *
 * resources/dev vs resources/prod: files in `dev/` target the mock backend.
 * For a real backend, add a `prod/` counterpart that imports the production
 * auth store and calls your own endpoints, then point your screens at it.
 * The `.r.ts` suffix marks a file as a data resource.
 */
import { client, unwrap, unwrapMessage } from "@/api/client";
import type { JsonBody } from "@/api/types";
import { useAuthStore } from "@/stores/dev/auth.store";
import { useMutation } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Platform } from "react-native";

/** Identifies this device to the backend, e.g. "my-app ios". */
const DEVICE_NAME = `${Constants.expoConfig?.name ?? "app"} ${Platform.OS}`;

/** Signs in and stores the returned token. */
export function useLogin() {
  return useMutation({
    mutationFn: async (body: JsonBody<"/v1/auth/login", "post">) =>
      unwrap(
        client.POST("/v1/auth/login", {
          body: { device_name: DEVICE_NAME, ...body },
        }),
      ),
    onSuccess: (session) => useAuthStore.getState().setSession(session.token),
    meta: { skipGlobalError: true },
  });
}

/** Revokes the token server-side. The local session is cleared even if the request fails. */
export function useLogout() {
  return useMutation({
    mutationFn: async () => unwrapMessage(client.POST("/v1/auth/logout")),
    onSettled: () => useAuthStore.getState().clearSession(),
  });
}
