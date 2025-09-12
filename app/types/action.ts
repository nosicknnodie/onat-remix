export type FieldErrors = Record<string, string[] | undefined>;
type ActionDataInterface<T = undefined> = {
  ok: boolean;
  message?: string;
  data?: T;
  fieldErrors?: FieldErrors;
};

export interface ActionSuccess<T = undefined> extends ActionDataInterface<T> {
  ok: true;
  data?: T;
}

export interface ActionFailure extends ActionDataInterface {
  ok: false;
  data?: undefined;
}

export type ActionData<T = undefined> = ActionSuccess<T> | ActionFailure;
