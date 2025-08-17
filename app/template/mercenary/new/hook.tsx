import { useFetcher } from "@remix-run/react";
import _ from "lodash";
import { createContext, useContext, useEffect, useState } from "react";
import type { action } from "./data";

export const NewMercenaryContext = createContext({} as ReturnType<typeof useNewMercenary>);

export const useNewMercenaryContext = () => {
  return useContext(NewMercenaryContext);
};

export const useNewMercenary = () => {
  const fetcher = useFetcher<typeof action>();
  const [positions, setPositions] = useState<string[]>();
  const [name, setName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.user) {
      setPositions(
        _.compact([
          fetcher.data.user.position1,
          fetcher.data.user.position2,
          fetcher.data.user.position3,
        ]),
      );
      setName(fetcher.data?.user?.name || "");
      setUserId(fetcher.data?.user?.id || null);
    }
  }, [fetcher.data, fetcher.state]);
  return { fetcher, positions, name, userId, setName, setPositions };
};
