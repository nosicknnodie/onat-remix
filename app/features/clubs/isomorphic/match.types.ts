import type { service } from "../server";

export type ClubMatchFeed = Awaited<ReturnType<typeof service.getClubMatchesFeed>>;
export type ClubMatchItem = ClubMatchFeed["matches"][number];
