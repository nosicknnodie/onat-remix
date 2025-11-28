import { atomWithStorage } from "jotai/utils";
import type { IKakaoLocalType } from "~/libs/isomorphic";

export const placeHistoryAtom = atomWithStorage<(IKakaoLocalType & { count?: number })[] | []>(
  "PLACE_HISTORY_ATOM",
  [],
);
