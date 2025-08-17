export type PageInfo = {
  hasMore: boolean;
  nextCursor: string | null;
  take: number;
};

export type Filters = {
  flair?: string | null;
  sort?: "new" | "hot" | "top";
  period?: "day" | "week" | "month" | "year" | "all";
  q?: string | null;
};

export type InfiniteState<T> = {
  scopeKey: string; // slug:type:filters 해시
  items: T[];
  pageInfo: PageInfo;
  busy: boolean;
  error?: string | null;
  filters: Filters;
};

export type InfiniteActions<T> =
  | {
      type: "RESET";
      payload: {
        items: T[];
        pageInfo: PageInfo;
        scopeKey: string;
        filters: Filters;
      };
    }
  | { type: "APPEND"; payload: { items: T[]; pageInfo: PageInfo } }
  | { type: "BUSY"; payload: boolean }
  | { type: "ERROR"; payload: string | null }
  | { type: "SET_FILTERS"; payload: Filters };

export type Ctx<T> = {
  state: InfiniteState<T>;
  loadMore: () => void;
  resetWith: (args: { items: T[]; pageInfo: PageInfo; filters?: Filters }) => void;
  setFilters: (f: Filters) => void;
};
