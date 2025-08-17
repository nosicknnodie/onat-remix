import type { InfiniteActions, InfiniteState, PageInfo } from "./types";

// 런타임 key(itemsKey)로 배열과 pageInfo 존재를 안전하게 판별하는 타입 가드
export function hasItemsAndPageInfo<T>(
  obj: unknown,
  key: string,
): obj is { pageInfo: PageInfo } & Record<string, T[]> {
  if (!obj || typeof obj !== "object") return false;
  const rec = obj as Record<string, unknown>;
  const items = rec[key];
  const newLocal = "pageInfo";
  const pageInfo = rec[newLocal];
  return Array.isArray(items) && !!pageInfo && typeof pageInfo === "object";
}

export function reducer<T>(state: InfiniteState<T>, action: InfiniteActions<T>): InfiniteState<T> {
  switch (action.type) {
    case "RESET":
      return { ...state, ...action.payload, error: null, busy: false };
    case "APPEND":
      return {
        ...state,
        items: [...state.items, ...action.payload.items],
        pageInfo: action.payload.pageInfo,
        busy: false,
        error: null,
      };
    case "BUSY":
      return { ...state, busy: action.payload };
    case "ERROR":
      return { ...state, error: action.payload, busy: false };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    default:
      return state;
  }
}
