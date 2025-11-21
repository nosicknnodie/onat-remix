import type { AttendanceState, File, User } from "@prisma/client";

type AttendanceUser = (User & { userImage?: File | null }) | null;

export type AttendanceClubPlayer = {
  id: string;
  userId: string | null;
  status: string;
  user: AttendanceUser;
};

export type AttendanceMercenary = {
  id: string;
  name?: string | null;
  hp?: string | null;
  userId?: string | null;
  user: AttendanceUser;
};

export type AttendanceRecord = {
  id: string;
  isVote: boolean;
  isCheck: boolean;
  checkTime?: string | Date | null;
  voteTime?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  evaluations?: Array<{ score?: number | null; liked?: boolean | null }>;
  assigneds?: Array<{
    id: string;
    quarterId: string;
    teamId?: string | null;
    goals?: Array<unknown> | null;
  }>;
  records?: Array<{
    id: string;
    quarterId: string;
    teamId?: string | null;
    isOwnGoal: boolean;
  }>;
  playerId: string | null;
  mercenaryId: string | null;
  teamId?: string | null;
  player: {
    id: string;
    user: AttendanceUser;
  } | null;
  mercenary: AttendanceMercenary | null;
};

export type AttendanceMatchClub = {
  id: string;
  matchId: string;
  match: {
    id: string;
    title: string;
    description?: string | null;
    stDate: string | Date;
    placeName?: string | null;
    address?: string | null;
    createdAt?: string | Date;
    createUser?: AttendanceUser;
  };
  club: {
    id: string;
    name: string;
    emblem?: { url?: string | null } | null;
    image?: { url?: string | null } | null;
    players: AttendanceClubPlayer[];
    mercenarys: AttendanceMercenary[];
  };
  attendances: AttendanceRecord[];
};

export type AttendanceStatus = "ATTEND" | "ABSENT" | "PENDING";
export type AttendanceCheckStatus = "CHECKED" | "NOT_CHECKED" | "PENDING";

export type AttendanceQueryData = {
  matchClub: AttendanceMatchClub;
  currentStatus: AttendanceStatus;
  currentChecked: AttendanceCheckStatus;
};

export type AttendanceQueryResponse = AttendanceQueryData | { redirectTo: string };

export type AttendanceMutationInput = {
  isVote: boolean;
  isCheck: boolean;
  mercenaryId?: string | null;
};

export type AttendanceMutationResponse = { ok: true } | { redirectTo: string };

export type AttendanceStateMutationInput = {
  id: string;
  state: AttendanceState;
};
