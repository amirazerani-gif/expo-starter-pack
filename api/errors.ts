/**
 * api/errors.ts
 * The single error type for failed HTTP responses. The client throws it,
 * TanStack Query carries it, and hooks and components read it.
 *
 * Usage:
 *   if (isApiError(error) && error.status === 422) {
 *     setError("email", { message: error.fieldErrors.email });
 *   }
 */

/** Laravel's standard error body (422 validation, 401, 403, 404, 500...). */
export type ErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ErrorBody | null,
    public readonly method: string,
    public readonly url: string,
  ) {
    super(body?.message ?? `${method} ${url} failed with ${status}`);
    this.name = "ApiError";
  }

  /** First message per field, ready for a form's per-field error display. */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [field, messages] of Object.entries(this.body?.errors ?? {})) {
      if (messages[0]) out[field] = messages[0];
    }
    return out;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;
