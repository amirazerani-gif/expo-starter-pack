/**
 * hooks/core/useErrorListener.tsx
 * Displays errors published to the error store as toasts. Mount
 * <ErrorToastListener /> once, inside the root layout, next to <ToastHost />.
 *
 * To change how an error type looks (title, toast style), edit ERROR_CONFIG.
 * Server and network errors stay on screen longer than the rest. The message,
 * the extra validation lines and the HTTP status badge come from the error.
 */
import { toast, type ToastType } from "@/components/ui/toast";
import { useErrorStore, type ErrorType } from "@/stores/core/error.store";
import { useEffect } from "react";

const ERROR_CONFIG: Record<ErrorType, { title: string; type: ToastType }> = {
  validation: { title: "Validation Error", type: "warning" },
  auth: { title: "Session Expired", type: "warning" },
  forbidden: { title: "Access Denied", type: "warning" },
  not_found: { title: "Not Found", type: "info" },
  server: { title: "Server Error", type: "error" },
  network: { title: "Network Error", type: "error" },
  unknown: { title: "Something went wrong", type: "error" },
};

export function ErrorToastListener() {
  const error = useErrorStore((s) => s.error);

  useEffect(() => {
    if (!error) return;
    const config = ERROR_CONFIG[error.type] ?? ERROR_CONFIG.unknown;

    // `message` already holds the first validation error: list the rest.
    const rest = error.validationErrors
      ? Object.values(error.validationErrors).flat().slice(1)
      : [];

    toast.show({
      type: config.type,
      title: config.title,
      message: error.message,
      details: rest.length > 0 ? rest : undefined,
      meta: error.status !== null ? String(error.status) : undefined,
      duration:
        error.type === "server" || error.type === "network" ? 5000 : 3500,
    });
    useErrorStore.getState().clearError();
  }, [error]);

  return null;
}
