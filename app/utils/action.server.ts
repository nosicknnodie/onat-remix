import type { ActionFailure, ActionSuccess, FieldErrors } from "~/types/action";

export const ok = <T = undefined>(data?: T, message?: string): ActionSuccess<T> => ({
  ok: true,
  data,
  message,
});

export const fail = (message?: string, fieldErrors?: FieldErrors): ActionFailure => ({
  ok: false,
  message,
  fieldErrors,
});
