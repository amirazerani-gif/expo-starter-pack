/**
 * stores/core/error.store.ts
 * Central error surface. Turns any thrown value into a ParsedError (a type,
 * a user-facing message and, for 422s, the field errors) and publishes it
 * for ErrorToastListener to display.
 *
 * Understands ApiError (thrown by api/client.ts) and raw fetch failures
 * (network down, DNS, timeout). Cancelled requests are ignored.
 *
 *   reportError  log + toast, never throws. Used by the query client's
 *                global error routing.
 *   showError    log + toast, then rethrows. For a call site that wants to
 *                surface an error and still propagate it.
 *
 * Usage:
 *   useErrorStore.getState().reportError(error);
 */
import { ApiError, isApiError } from "@/api/errors";
import { create } from "zustand";

export type ErrorType =
  | "validation"
  | "auth"
  | "forbidden"
  | "not_found"
  | "server"
  | "network"
  | "unknown";

export interface ParsedError {
  message: string;
  type: ErrorType;
  status: number | null;
  validationErrors: Record<string, string[]> | null;
}

const NETWORK_RE =
  /network request failed|failed to fetch|load failed|network error|timed out/i;

const isAbort = (e: unknown) =>
  typeof e === "object" &&
  e !== null &&
  (e as { name?: string }).name === "AbortError";

const isNetworkError = (e: unknown): e is Error =>
  e instanceof TypeError && NETWORK_RE.test(e.message);

function fromApiError(err: ApiError): ParsedError {
  const { status, body } = err;

  if (status === 422) {
    const validationErrors = body?.errors ?? null;
    const first = validationErrors
      ? Object.values(validationErrors).flat()[0]
      : null;
    return {
      message: first ?? body?.message ?? "Validation failed.",
      type: "validation",
      status,
      validationErrors,
    };
  }

  const base = { status, validationErrors: null };
  if (status === 401)
    return {
      ...base,
      type: "auth",
      message: body?.message ?? "Session expired. Please log in again.",
    };
  if (status === 403)
    return {
      ...base,
      type: "forbidden",
      message: body?.message ?? "You do not have permission.",
    };
  if (status === 404)
    return {
      ...base,
      type: "not_found",
      message: body?.message ?? "Resource not found.",
    };
  if (status >= 500)
    return {
      ...base,
      type: "server",
      message: "A server error occurred. Please try again later.",
    };

  return {
    ...base,
    type: "unknown",
    message: body?.message ?? "Something went wrong.",
  };
}

/** Maps any thrown value to a ParsedError. */
export function parseError(raw: unknown): ParsedError {
  if (isApiError(raw)) return fromApiError(raw);

  // The client's onError middleware only logs, so raw fetch failures arrive
  // here as plain TypeErrors rather than ApiErrors.
  if (isNetworkError(raw)) {
    return {
      message: "Network error. Please check your connection.",
      type: "network",
      status: null,
      validationErrors: null,
    };
  }

  return {
    message: "An unexpected error occurred.",
    type: "unknown",
    status: null,
    validationErrors: null,
  };
}

interface ErrorState {
  error: ParsedError | null;
  /** Log + toast, never throws. */
  reportError: (raw: unknown) => void;
  /** Log + toast, then rethrow the original error. */
  showError: (raw: unknown) => never;
  clearError: () => void;
}

export const useErrorStore = create<ErrorState>((set) => {
  const surface = (raw: unknown) => {
    // A cancelled request (unmounted screen, changed query key) is not a failure.
    if (isAbort(raw)) return;

    const parsed = parseError(raw);
    console.error(
      `[ERROR] ${parsed.type.toUpperCase()} | Status: ${parsed.status ?? "N/A"} | ${parsed.message}`,
      "\nRaw:",
      raw,
    );
    if (parsed.validationErrors)
      console.error("Validation errors:", parsed.validationErrors);

    set({ error: parsed });
  };

  return {
    error: null,
    reportError: (raw) => surface(raw),
    showError: (raw) => {
      surface(raw);
      throw raw;
    },
    clearError: () => set({ error: null }),
  };
});
