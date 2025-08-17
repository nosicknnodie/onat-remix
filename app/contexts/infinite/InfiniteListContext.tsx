/** biome-ignore-all lint/correctness/useExhaustiveDependencies: off */
/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import { useFetcher, useLocation } from "@remix-run/react";
import { createContext, useCallback, useEffect, useMemo, useReducer } from "react";
import { hasItemsAndPageInfo, reducer } from "./internals";
import type { Ctx, Filters, PageInfo } from "./types";

type ProviderProps<T> = {
  slug: string;
  type: "compact" | "card";
  initialItems: T[];
  initialPageInfo: PageInfo;
  initialFilters?: Filters;
  itemsKey?: string;
  keySelector?: (item: T) => string;
  children: React.ReactNode;
};

export const InfiniteListCtx = createContext<Ctx<any> | null>(null);

export function InfiniteListProvider<T>({
  slug,
  type,
  initialItems,
  initialPageInfo,
  initialFilters,
  itemsKey = "posts",
  keySelector = (data) => String(data),
  children,
}: ProviderProps<T>) {
  const fetcher = useFetcher();
  const { pathname } = useLocation();
  const scopeKey = useMemo(() => {
    const f = initialFilters ?? {};
    return `${slug}:${type}:${JSON.stringify(f)}`;
  }, [slug, type, initialFilters]);

  const [state, dispatch] = useReducer(reducer<T>, {
    scopeKey,
    items: initialItems,
    pageInfo: initialPageInfo,
    busy: false,
    error: null,
    filters: initialFilters ?? {},
  });

  // fetcher 응답 처리 (항상 동일한 shape를 리턴하도록 loader 설계 권장)
  useEffect(() => {
    const d = fetcher.data as object | undefined;
    if (hasItemsAndPageInfo<T>(d, itemsKey)) {
      const incoming = d[itemsKey] as T[];
      // Deduplicate by keySelector to avoid duplicate keys on HMR or double fetch
      const seen = new Set(state.items.map((it) => keySelector(it)));
      const toAdd = incoming.filter((it) => {
        try {
          const k = keySelector(it);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        } catch {
          // If keySelector fails, fallback to allow
          return true;
        }
      });
      dispatch({
        type: "APPEND",
        payload: { items: toAdd, pageInfo: d.pageInfo },
      });
      return;
    }
  }, [fetcher.data]);

  const loadMore = useCallback(() => {
    if (state.busy || !state.pageInfo.hasMore || fetcher.state !== "idle") return;
    dispatch({ type: "BUSY", payload: true });

    const params = new URLSearchParams();
    params.set("take", String(state.pageInfo.take));
    if (state.pageInfo.nextCursor) params.set("cursor", String(state.pageInfo.nextCursor));

    // 필터를 쿼리에 반영 (서버에서 동일하게 읽어야 함)
    const { flair, sort, period, q } = state.filters;
    if (flair) params.set("flair", flair);
    if (sort) params.set("sort", sort);
    if (period) params.set("period", period);
    if (q) params.set("q", q);

    fetcher.load(`${pathname}?index&${params.toString()}`);
  }, [state.busy, state.pageInfo, state.filters, fetcher.state, pathname]);

  const resetWith = useCallback(
    (args: { items: T[]; pageInfo: PageInfo; filters?: Filters }) => {
      const scopeKey = `${slug}:${type}:${JSON.stringify(args.filters ?? state.filters)}`;
      dispatch({
        type: "RESET",
        payload: {
          items: args.items,
          pageInfo: args.pageInfo,
          scopeKey,
          filters: args.filters ?? state.filters,
        },
      });
    },
    [slug, type, state.filters],
  );

  const setFilters = useCallback((f: Filters) => {
    dispatch({ type: "SET_FILTERS", payload: f });
  }, []);

  const value = useMemo<Ctx<T>>(
    () => ({ state, loadMore, resetWith, setFilters }),
    [state, loadMore, resetWith, setFilters],
  );

  return <InfiniteListCtx.Provider value={value}>{children}</InfiniteListCtx.Provider>;
}
