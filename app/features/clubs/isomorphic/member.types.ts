import type { PlayerPermissionKey } from "@prisma/client";
import type { service } from "../server";

export type ClubApprovedMembers = Awaited<ReturnType<typeof service.getClubMembers>>;
export type ClubPendingMembers = Awaited<ReturnType<typeof service.getPendingClubMembers>>;
export type ClubMember = ClubApprovedMembers[number];
export type PlayerEffectivePermissions = PlayerPermissionKey[];
