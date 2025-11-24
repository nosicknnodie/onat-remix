/**
 * 

model Match {
  id              String        @id @default(cuid())
  title           String
  description     Json
  placeName       String?
  address         String?
  lng             Float?      
  lat             Float?     
  stDate          DateTime
  
  
  matchClubs      MatchClub[]
  createUserId    String?
  createUser      User?    @relation(fields: [createUserId], references: [id], onDelete: SetNull)
  createPlayerId  String?
  createPlayer    Player?  @relation("MatchCreatePlayer", fields: [createPlayerId], references: [id], onDelete: SetNull)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @default(now()) @updatedAt

}


model MatchClub {
  id            String        @id @default(cuid())
  legacyId      String?       @db.Uuid
  matchId       String        
  match         Match         @relation(fields: [matchId], references: [id], onDelete: Cascade)
  clubId        String
  club          Club          @relation(fields: [clubId], references: [id], onDelete: Cascade)
  isSelf        Boolean       @default(false)   // 자체전 여부
  discordWebhookMessageId String? // 디스코드 웹훅 메세지 아이디
  attendances   Attendance[]
  quarters      Quarter[]
  teams         Team[]
  evaluations   Evaluation[]
  total         MatchClubStatsTotal?
  totalHistory  MatchClubStatsHistory?

  isUse         Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @default(now()) @updatedAt

  @@index([clubId])
  @@index([matchId])
  @@unique([matchId, clubId])
}


SUPBASE RESULT
matche -  {
  uid: '57507aea-3f2a-4f6d-95c1-301b5cc50133',
  title: '상대 테크노',
  st_date: '2023-06-17T23:00:00+00:00',
  en_date: null,
  created_at: '2023-06-12T12:11:11.543904+00:00',
  updated_at: '2023-08-18T07:13:45.995946+00:00',
  place_name: '고척 스카이돔 축구장',
  created_user_uid: '0ffe3256-097f-48b0-ad2b-46badd39367b',
  place_uid: '58e10637-b65c-4ec3-acf5-c87d8ef878c6',
  self_fight: false,
  is_used: true,
  club_id: 'sugar',
  place: {
    uid: '58e10637-b65c-4ec3-acf5-c87d8ef878c6',
    created_at: '2023-05-13T06:13:44.250252+00:00',
    updated_at: '2023-05-13T06:13:44.250252+00:00',
    name: '고척 스카이돔 축구장',
    address: '서울특별시 구로구 고척제1동 279-4',
    size: '90 * 50',
    sort: 2,
    is_use: true,
    content: '<p><img src="https://slaogtcglmeoiekvacyi.supabase.co/storage/v1/object/public/places/0ffe3256-097f-48b0-ad2b-46badd39367b/9a1a6132-cfca-42ae-b54e-78d0edde4759.png"></p>'
  }
}
 */

import { supabase } from ".";
import { prisma } from "./prisma.db";

export const matchMigration = async () => {
  console.log("⏳ [matchMigration] start");
  const { data: matches, error } = await supabase.from("match").select("*, place:place(*)");
  if (error) {
    console.error("match select error - ", error);
    return;
  }
  console.log("⏳ [matchMigration] lookup users/players/club");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      legacyId: true,
    },
  });
  const players = await prisma.player.findMany({
    select: {
      id: true,
      legacyId: true,
      user: {
        select: {
          id: true,
          legacyId: true,
        },
      },
    },
  });
  const club = await prisma.club.findFirst({ where: { name: "슈가FC" } });
  if (!club) {
    console.error("❌ [matchMigration] club not found");
    return;
  }
  const userMap = new Map(
    users
      .filter((user): user is { id: string; legacyId: string } => Boolean(user.legacyId))
      .map((user) => [user.legacyId, user.id]),
  );
  const playerMap = new Map(
    players
      .filter(
        (
          player,
        ): player is { id: string; legacyId: string; user: { id: string; legacyId: string } } =>
          Boolean(player.legacyId && player.user?.legacyId),
      )
      .map((player) => [player.user.legacyId, player.id]),
  );
  const migrationMatches = matches
    ?.filter((match) => match.is_used)
    .map((match) => {
      const createUserId = userMap.get(match.created_user_uid ?? "") ?? null;
      const createPlayerId = playerMap.get(match.created_user_uid ?? "") ?? null;
      return {
        legacyId: match.uid,
        isSelf: match.self_fight,
        isUse: match.is_used,
        title: match.title,
        description: {
          root: {
            children: [],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
        placeName: match.place?.name,
        address: match.place?.address,
        stDate: match.st_date,
        createUserId,
        createPlayerId,
        createdAt: match.created_at,
        updatedAt: match.updated_at,
      };
    });
  if (!migrationMatches?.length) {
    console.log("ℹ️ [matchMigration] no matches to migrate");
    return;
  }

  const existingMatchClubs = await prisma.matchClub.findMany({
    where: {
      legacyId: {
        in: migrationMatches.map((match) => match.legacyId),
      },
    },
    select: {
      legacyId: true,
    },
  });

  const existingLegacyIdSet = new Set(
    existingMatchClubs
      .map((matchClub) => matchClub.legacyId)
      .filter((legacyId): legacyId is string => Boolean(legacyId)),
  );

  let createdCount = 0;
  let skippedCount = 0;

  for (const match of migrationMatches) {
    if (existingLegacyIdSet.has(match.legacyId)) {
      skippedCount += 1;
      continue;
    }

    const createdMatch = await prisma.match.create({
      data: {
        title: match.title ?? "",
        description: match.description,
        placeName: match.placeName ?? null,
        address: match.address ?? null,
        stDate: new Date(match.stDate),
        createUserId: match.createUserId,
        createPlayerId: match.createPlayerId,
        createdAt: match.createdAt ? new Date(match.createdAt) : undefined,
        updatedAt: match.updatedAt ? new Date(match.updatedAt) : undefined,
      },
    });

    await prisma.matchClub.create({
      data: {
        legacyId: match.legacyId,
        matchId: createdMatch.id,
        clubId: club.id,
        isSelf: match.isSelf ?? false,
        isUse: match.isUse ?? true,
        createdAt: match.createdAt ? new Date(match.createdAt) : undefined,
        updatedAt: match.updatedAt ? new Date(match.updatedAt) : undefined,
      },
    });

    createdCount += 1;
  }

  console.log("✅ [matchMigration] completed", {
    total: migrationMatches.length,
    created: createdCount,
    skippedExisting: skippedCount,
  });
};
