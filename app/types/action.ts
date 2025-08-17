export type FieldErrors = Record<string, string[] | undefined>;
export type ActionSuccess<T = undefined> = {
  ok: true;
  message?: string;
  data?: T;
  fieldErrors?: FieldErrors;
};
export type ActionFailure = {
  ok: false;
  message?: string;
  data?: undefined;
  fieldErrors?: FieldErrors;
};
export type ActionData<T = undefined> = ActionSuccess<T> | ActionFailure;
