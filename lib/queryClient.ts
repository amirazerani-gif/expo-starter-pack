/**
 * lib/queryClient.ts
 * The single QueryClient, plus everything that connects TanStack Query to
 * the app: connectivity, app focus, global error routing and sign-out cleanup.
 *
 * Wiring: import `queryClient` into <QueryClientProvider> and call
 * useAppFocus() once, both in the root layout.
 *
 * Error routing:
 *  - Mutations: failures toast by default. A mutation that feeds a form with
 *    inline errors opts out with `meta: { skipGlobalError: true }`. That only
 *    covers 4xx: 5xx and network failures always toast, since nothing inline
 *    can meaningfully handle them.
 *  - Queries: silent by default, so a background refetch never interrupts
 *    the user. Opt in per query with `meta: { reportErrors: true }`.
 */
import { isApiError } from "@/api/errors";
import { useErrorStore } from "@/stores/core/error.store";
import { useAuthStore } from "@/stores/dev/auth.store";
import NetInfo from "@react-native-community/netinfo";
import {
  focusManager,
  MutationCache,
  onlineManager,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";

// ─── Typed meta ───────────────────────────────────────────────
// Makes `meta` flags autocomplete and turns typos into compile errors.
declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /** Toast when this query fails. Default: silent. */
      reportErrors?: boolean;
    };
    mutationMeta: {
      /** Skip the global toast for 4xx; the call site shows the error inline. */
      skipGlobalError?: boolean;
    };
  }
}

// ─── Connectivity ─────────────────────────────────────────────
// Pauses requests while offline and resumes them when the network returns.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) =>
    setOnline(!!state.isConnected && state.isInternetReachable !== false),
  ),
);

// ─── App focus ────────────────────────────────────────────────
/** Refetches stale queries when the app returns to the foreground. */
export function useAppFocus() {
  useEffect(() => {
    const sub = AppState.addEventListener("change", (status) =>
      focusManager.setFocused(status === "active"),
    );
    return () => sub.remove();
  }, []);
}

// ─── Client ───────────────────────────────────────────────────
/** A 4xx the call site can handle inline. Everything else is global. */
const isInlineHandleable = (error: unknown) =>
  isApiError(error) && error.status < 500;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // A 4xx fails the same way every time, so only 5xx and network
      // failures are retried (twice).
      retry: (count, error) => !isInlineHandleable(error) && count < 2,
    },
    // Never retry mutations: a silent retry could submit a form twice.
    mutations: { retry: false },
  },

  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.meta?.skipGlobalError && isInlineHandleable(error)) return;
      useErrorStore.getState().reportError(error);
    },
  }),

  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!query.meta?.reportErrors) return;
      useErrorStore.getState().reportError(error);
    },
  }),
});

// ─── Sign-out cleanup ─────────────────────────────────────────
// Whatever ends the session (logout, 401, account deletion), in-flight
// requests are cancelled and no cached data survives to the next user.
useAuthStore.subscribe((state, prev) => {
  if (state.status === "guest" && prev.status !== "guest") {
    void queryClient.cancelQueries();
    queryClient.clear();
  }
});
