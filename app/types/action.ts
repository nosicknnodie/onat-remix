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

// API 라우트에서 권장되는 확장 스키마
// - 표준 ActionData에 선택적 에러 코드(`code`)를 추가합니다.
// - 클라이언트는 존재 시 `code`를 우선적으로 활용할 수 있습니다.
export type ApiActionData<T = undefined> = ActionData<T> & {
  code?:
    | "AUTH_REQUIRED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "VALIDATION"
    | "NETWORK"
    | "SERVER"
    | "UNKNOWN";
};
