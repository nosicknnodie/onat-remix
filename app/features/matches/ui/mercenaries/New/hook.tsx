import type { PositionType } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import _ from "lodash";
import { createContext, useContext, useEffect, useState } from "react";

export const NewMercenaryContext = createContext({} as ReturnType<typeof useNewMercenary>);

export const useNewMercenaryContext = () => useContext(NewMercenaryContext);

type SearchUserResponse = {
  user?: {
    id: string;
    name?: string | null;
    position1?: PositionType | null;
    position2?: PositionType | null;
    position3?: PositionType | null;
  };
};

export const useNewMercenary = () => {
  const fetcher = useFetcher<SearchUserResponse>();
  const [positions, setPositions] = useState<string[]>();
  const [name, setName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.user) {
      const user = fetcher.data.user;
      setPositions(
        _.compact([user?.position1 || null, user?.position2 || null, user?.position3 || null]),
      );
      setName(user?.name || "");
      setUserId(user?.id || null);
    }
  }, [fetcher.data, fetcher.state]);
  return { fetcher, positions, name, userId, setName, setPositions };
};
