import type { Team } from "@prisma/client";

export type TeamQueryData = {
  teams: Team[];
};

export type TeamQueryResponse = TeamQueryData | { redirectTo: string };
