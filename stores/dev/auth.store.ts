/**
 * stores/dev/auth.store.ts
 * Auth store for the template, used with the mock backend (`npm run mock`).
 *
 * Owns client state only: the access token (persisted in SecureStore) and
 * whether the app knows who is signed in. The user object is server state
 * and lives in useMe() (hooks/resources/dev/User.r.ts), not here.
 *
 * Consumers:
 *  - api/client.ts reads `token` to authenticate requests
 *  - the root layout calls `hydrate()` once at boot
 *  - auth hooks call `setSession` / `clearSession`
 *  - route guards read `status`
 * It imports nothing from the api layer, which avoids import cycles.
 *
 * Connecting a real backend: create stores/prod/auth.store.ts (or edit this
 * file in place) and update the imports in api/client.ts, lib/queryClient.ts,
 * the root layout, the guards and the resource hooks.
 */
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const TOKEN_KEY = "userToken";

/** loading: token not read yet. authed: token present. guest: no token. */
export type AuthStatus = "loading" | "authed" | "guest";

type AuthState = {
  token: string | null;
  status: AuthStatus;
  /** Reads the stored token. Call once at boot, before rendering routes. */
  hydrate: () => Promise<void>;
  /** Persists a new token and marks the user as signed in. */
  setSession: (token: string) => Promise<void>;
  /** Signs out locally. Safe to call when already signed out. */
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  status: "loading",

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      set({ token, status: token ? "authed" : "guest" });
    } catch {
      set({ token: null, status: "guest" });
    }
  },

  setSession: async (token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, status: "authed" });
  },

  clearSession: async () => {
    // Update state first so the UI reacts immediately; storage cleanup follows.
    set({ token: null, status: "guest" });
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  },
}));
