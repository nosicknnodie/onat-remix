import type { ActionFailure, ActionSuccess, FieldErrors } from "~/types/action";

/**
 * Build a successful ActionData payload.
 * - Use in actions to standardize JSON responses.
 */
export const ok = <T = undefined>(data?: T, message?: string): ActionSuccess<T> => ({
  ok: true,
  data,
  message,
});

/**
 * Build a failed ActionData payload with optional fieldErrors.
 * - Attach `fieldErrors` as `{ [field]: string[] }` when validation fails.
 */
export const fail = (message?: string, fieldErrors?: FieldErrors): ActionFailure => ({
  ok: false,
  message,
  fieldErrors,
});
