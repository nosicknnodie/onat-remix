import { Club, Player } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";

export const PlayersContext = createContext<
  ReturnType<typeof usePlayersQuery> | undefined
>(undefined);

export const usePlayersQuery = ({ club }: { club: Club }) => {
  return useQuery({
    queryKey: ["CLUB_PLAYERS_QUERY"],
    queryFn: async () =>
      (await fetch(`/api/clubs/${club.id}/players`).then((res) =>
        res.json()
      )) as {
        players: Player[];
      },
    enabled: !!club.id,
  });
};

export const useGetPlayers = () => {
  const groupQuery = useContext(PlayersContext);
  return groupQuery;
};
