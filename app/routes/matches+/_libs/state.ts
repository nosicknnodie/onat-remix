import { atomWithStorage } from "jotai/utils";
import { IKakaoLocalType } from "~/libs/map";

export const placeHistoryAtom = atomWithStorage<(IKakaoLocalType & { count?: number })[] | []>(
  "PLACE_HISTORY_ATOM",
  [],
);
