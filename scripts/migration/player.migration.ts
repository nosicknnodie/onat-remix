/**
 model Player {
  id              String    @id @default(cuid())
  legacyId        String?    @db.Uuid
  nick            String
  userId          String?
  jobTitle        JobTitle? @default(NO)
  role            RoleType  @default(PENDING)
  permissions     PlayerPermission[]
  clubId          String

  isInjury        Boolean  @default(false)
  isRest          Boolean  @default(false)
  status          StatusType @default(PENDING)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @default(now()) @updatedAt
  
  user              User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  club              Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)
  attendances       Attendance[]
  playerLogs        PlayerLog[]
  createdPlayerLogs PlayerLog[] @relation("PlayerLogCreatePlayer")
  createdMatches    Match[] @relation("MatchCreatePlayer")
  comments          Comment[]
  toReplies         Comment[] @relation("CommentReplyToPlayer")
  posts             Post[]
  postComments      PostComment[]

  @@index([clubId])
  @@index([userId])
  @@unique([clubId, userId])
}
  **************************************
  SUPBASE RESULT
  players -  {
  birth: '1992-07-12',
  name: '김덕중',
  created_at: '2023-07-21T00:23:39.582198+00:00',
  updated_at: '2023-12-02T05:01:30.305296+00:00',
  uid: '24c795e7-5e85-45b5-bd3f-1a2cf90f979c',
  is_used: false,
  image_url: null,
  user_uid: 'c12e7aa8-766b-4c95-9675-40315bb6d59a',
  code: '7000',
  title: '탈퇴',
  updated_uid: null,
  uniform_num: null,
  attendance_rate: 8.69,
  main_position: 'CM',
  prefer_position: 'CM',
  possible_positions: [ 'RB', 'CM' ],
  club_id: 'sugar'
}
 */

import type { Prisma } from "@prisma/client";
import { JobTitle, RoleType, StatusType } from "@prisma/client";
import { supabase } from ".";
import { prisma } from "./prisma.db";

type LegacyPlayerRow = {
  uid: string | null;
  user_uid: string | null;
  name: string;
  title: string | null;
  is_used: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export const playerMigration = async () => {
  console.log("⏳ [playerMigration] fetch players from supabase");
  const { data: players, error: playerError } = await supabase.from("player").select("*");

  if (playerError) {
    console.error("player select error - ", playerError);
    return;
  }

  const playerRows = (players ?? []) as LegacyPlayerRow[];

  console.log("⏳ [playerMigration] lookup club and users");
  const sugarClub = await prisma.club.findFirst({ where: { name: "슈가FC" } });
  if (!sugarClub) return;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      legacyId: true,
    },
  });

  const legacyIds = playerRows
    .map((player) => player.uid)
    .filter((uid): uid is string => Boolean(uid));

  console.log("⏳ [playerMigration] check existing players in prisma", {
    incoming: legacyIds.length,
  });
  const existingPlayers = await prisma.player.findMany({
    where: {
      legacyId: {
        in: legacyIds,
      },
    },
    select: {
      id: true,
      legacyId: true,
    },
  });

  const existingLegacyIdSet = new Set(
    existingPlayers
      .map((player) => player.legacyId)
      .filter((legacyId): legacyId is string => Boolean(legacyId)),
  );

  const existingPlayerIdMap = new Map(
    existingPlayers
      .filter((player): player is { legacyId: string; id: string } => Boolean(player.legacyId))
      .map((player) => [player.legacyId, player.id]),
  );

  const userMap = new Map(
    users
      .filter((user): user is { id: string; legacyId: string } => Boolean(user.legacyId))
      .map((user) => [user.legacyId, user.id]),
  );

  const toCreate: Prisma.PlayerCreateInput[] = [];
  const toUpdate: Array<Prisma.PlayerUpdateArgs["data"] & { id: string }> = [];

  for (const player of playerRows) {
    const userId = userMap.get(player.user_uid ?? "") ?? null;
    let jobTitle: JobTitle = JobTitle.NO;
    switch (player.title) {
      case "회장":
        jobTitle = JobTitle.CHAIRMAN;
        break;
      case "운영진":
        jobTitle = JobTitle.OPERATOR;
        break;
      case "감독":
        jobTitle = JobTitle.DIRECTOR;
        break;
      case "코치":
        jobTitle = JobTitle.COACH;
        break;
      case "부회장":
        jobTitle = JobTitle.VICE_CHAIRMAN;
        break;
      case "총무":
        jobTitle = JobTitle.GENERAL_AFFAIRS;
        break;
      case "부총무":
        jobTitle = JobTitle.ASSISTANT_GENERAL_AFFAIRS;
        break;
      case "고문":
        jobTitle = JobTitle.ADVISER;
        break;
      default:
        jobTitle = JobTitle.NO;
        break;
    }
    const playerUid = player.uid;
    if (!playerUid) {
      continue;
    }

    const baseData: Prisma.PlayerCreateInput = {
      legacyId: playerUid,
      nick: player.name,
      role:
        player.user_uid === "0ffe3256-097f-48b0-ad2b-46badd39367b"
          ? RoleType.MASTER
          : !player.is_used
            ? RoleType.NO
            : jobTitle !== JobTitle.ADVISER && jobTitle !== JobTitle.NO
              ? RoleType.MANAGER
              : RoleType.NORMAL,
      club: { connect: { id: sugarClub.id } },
      jobTitle,
      isInjury: false,
      isRest: false,
      status: player.title === "탈퇴" || !player.is_used ? StatusType.LEFT : StatusType.APPROVED,
      updatedAt: player.updated_at ? new Date(player.updated_at) : undefined,
      ...(userId ? { user: { connect: { id: userId } } } : {}),
    };

    const existingId = existingPlayerIdMap.get(playerUid);

    if (existingId) {
      toUpdate.push({
        ...baseData,
        club: undefined,
        user: userId ? { connect: { id: userId } } : { disconnect: true },
        id: existingId,
      });
      continue;
    }

    if (!existingLegacyIdSet.has(playerUid)) {
      toCreate.push({
        ...baseData,
        club: { connect: { id: sugarClub.id } },
        ...(userId ? { user: { connect: { id: userId } } } : {}),
        createdAt: player.created_at ? new Date(player.created_at) : undefined,
      });
    }
  }
  console.log("ℹ️ [playerMigration] prepared migrate data", {
    totalFetched: playerRows.length,
    skippedExisting: existingLegacyIdSet.size,
    toCreate: toCreate.length,
    toUpdate: toUpdate.length,
  });
  if (toCreate.length === 0 && toUpdate.length === 0) {
    console.log("✅ [playerMigration] nothing to create or update, skip");
    return;
  }

  await prisma.$transaction([
    ...toCreate.map((data) =>
      prisma.player.create({
        data,
      }),
    ),
    ...toUpdate.map(({ id, ...data }) =>
      prisma.player.update({
        where: { id },
        data,
      }),
    ),
  ]);
  console.log("✅ [playerMigration] completed", {
    createdCount: toCreate.length,
    updatedCount: toUpdate.length,
  });
};
