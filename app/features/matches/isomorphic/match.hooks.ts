import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MatchFormDefault, MatchFormFields } from "./match.types";
import { matchClubQueryKeys } from "./matchClub.hooks";

type SaveMatchParams = {
  matchId?: string;
  payload: MatchFormFields;
  method?: "POST" | "PUT";
};

export function useSaveMatchMutation(_props?: { matchClubId?: string } | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    { ok: boolean; redirectTo?: string; id?: string; matchClubId?: string },
    unknown,
    SaveMatchParams
  >({
    mutationFn: async ({ matchId, payload, method = "PUT" }) => {
      const res = await fetch(
        method === "POST" ? "/api/matches/register" : `/api/matches/${matchId}`,
        {
          method,
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw json ?? new Error("Failed to save match");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["match", "club", variables.matchId] });
      if (_props?.matchClubId)
        void queryClient.invalidateQueries({
          queryKey: matchClubQueryKeys.detail(_props.matchClubId),
        });
    },
  });
}

export type MatchFormSubmitPayload = MatchFormDefault & {
  clubId?: string;
  isSelf?: boolean;
};
