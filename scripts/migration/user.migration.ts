import type { PositionType } from "@prisma/client";
import { supabase } from ".";
import { prisma } from "./prisma.db";

export const userMigration = async () => {
  console.log("⏳ [userMigration] fetch players from supabase");
  const { data: players, error: playerError } = await supabase.from("player").select("*");

  if (playerError) {
    console.error("player select error - ", playerError);
    return;
  }

  console.log("⏳ [userMigration] fetch auth users for players");
  const users = await Promise.all(
    (players ?? []).map(async (player) => {
      if (!player.user_uid) return { user: null, error: null };
      const res = await supabase.auth.admin.getUserById(player.user_uid);
      return { user: res.data.user ?? null, error: res.error ?? null };
    }),
  );

  const merged = (players ?? []).map((player, idx) => ({
    ...player,
    user: users[idx]?.user ?? null,
    userError: users[idx]?.error ?? null,
  }));

  const migrateData = merged
    .filter((item) => item.user && !item.userError && item.user?.email)
    .map((item) => {
      const positions = remakePosition(item.possible_positions);
      return {
        legacyId: item.user_uid,
        legacyEmail: item.user?.email,
        email: item.user?.email ?? null,
        name: item.name,
        birth: item.birth,
        nick: item.name,
        position1: positions.position1,
        position2: positions.position2,
        position3: positions.position3,
      };
    });
  console.log("ℹ️ [userMigration] prepared migrate data", { total: migrateData.length });
  const legacyIds = migrateData.map((data) => data.legacyId);

  const existingUsers = await prisma.user.findMany({
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

  const existingUserMap = new Map(
    existingUsers
      .filter((user): user is { id: string; legacyId: string } => Boolean(user.legacyId))
      .map((user) => [user.legacyId, user.id]),
  );

  const toCreate: typeof migrateData = [];
  const toUpdate: Array<(typeof migrateData)[number] & { id: string }> = [];

  const operations = migrateData.map((data) => {
    const existingId = existingUserMap.get(data.legacyId);

    if (existingId) {
      toUpdate.push({ ...data, id: existingId });
      return prisma.user.update({
        where: {
          id: existingId,
        },
        data,
      });
    }

    toCreate.push(data);
    return prisma.user.create({
      data,
    });
  });

  await prisma.$transaction(operations);
  console.log("✅ [userMigration] completed", {
    created: toCreate.length,
    updated: toUpdate.length,
  });
};

const positionType = [
  "LS",
  "ST",
  "RS",
  "LW",
  "LF",
  "CF",
  "RF",
  "RW",
  "LAM",
  "CAM",
  "RAM",
  "LM",
  "LCM",
  "CM",
  "RCM",
  "RM",
  "LWB",
  "LDM",
  "DM",
  "RDM",
  "RWB",
  "LB",
  "LCB",
  "SW",
  "RCB",
  "RB",
  "GK",
] as const satisfies ReadonlyArray<PositionType>;

const positionTypeSet = new Set<PositionType>(positionType);

const remakePosition = (positions?: string[] | null) => {
  const filtered = (positions ?? []).filter((p): p is PositionType =>
    positionTypeSet.has(p as PositionType),
  );
  const [position1, position2, position3] = filtered;

  return {
    position1: position1 ?? null,
    position2: position2 ?? null,
    position3: position3 ?? null,
  };
};

/**
 * 
 * SUPABASE RESPONSE
 {
    birth: '1995-01-27',
    name: '김범준',
    created_at: '2023-05-06T11:41:27.624637+00:00',
    updated_at: '2025-11-22T09:20:48.746651+00:00',
    uid: '030e75f6-5036-4213-bc9e-484e62391501',
    is_used: true,
    image_url: 'http://coresos.phinf.naver.net/a/346c54/c_957Ud018svcghsvu7yq6kdy_hafzfa.jpg',
    user_uid: '86b1f5cc-b1c6-4a68-beb6-c635a013058d',
    code: '2000',
    title: '회원',
    updated_uid: '0ffe3256-097f-48b0-ad2b-46badd39367b',
    uniform_num: 20,
    attendance_rate: 50.66,
    main_position: 'LW',
    prefer_position: null,
    possible_positions: [ 'LW', 'CF', 'LB' ],
    club_id: 'sugar',
    user: {
      id: '86b1f5cc-b1c6-4a68-beb6-c635a013058d',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'bumjun7518@naver.com',
      email_confirmed_at: '2023-07-12T02:11:07.749225Z',
      phone: '',
      confirmation_sent_at: '2023-07-12T01:25:33.38236Z',
      confirmed_at: '2023-07-12T02:11:07.749225Z',
      recovery_sent_at: '2024-04-12T22:31:46.397095Z',
      last_sign_in_at: '2025-01-24T22:27:38.705547Z',
      app_metadata: [Object],
      user_metadata: [Object],
      identities: [Array],
      created_at: '2023-07-12T01:25:33.358716Z',
      updated_at: '2025-11-22T04:23:57.691321Z',
      is_anonymous: false
    },
    userError: null
  }


  id            String    @id @default(cuid())
  legacyId      String    @unique @db.Uuid
  legacyEmail   String
  nick          String?
  name          String?
  email         String   @unique
  emailVerified DateTime? @map("email_verified")
  password      String?

  role          UserRoleType @default(NORMAL)
  userImageId   String? // 현재 설정된 프로필 이미지
  userImage     File? @relation("UserImage", fields: [userImageId], references: [id])
  uploadedImages   File[] @relation("UploadedImages")
  playerNative  PlayerNativeType? // 선출 중등 고등 대학 프로
  height        Int?       // 키
  birth         String?    // 생일
  gender        GenderType? // 성별
  position1     PositionType?
  position2     PositionType?
  position3     PositionType?
  si            String?     // 도시 (시도)
  gun           String?     // 지역 (시군구)
  clothesSize   String?        // 옷 사이즈
  shoesSize     String?        // 신발 사이즈

  ownerClubs    Club[]  @relation("ClubOwnerUser")
  createClubs   Club[]  @relation("ClubCreateUser")
  players       Player[]
  // toProposals   Proposal[]  @relation("toProposal")
  // fromProposals Proposal[]  @relation("fromProposal")
  mercenarys    Mercenary[]
  // applications  Application[]
  playerLogs    PlayerLog[]
  comments      Comment[]
  toReplies     Comment[] @relation("CommentReplyToUser")
  matchs        Match[]
  evaluations   Evaluation[]
  postComments  PostComment[]
  posts         Post[]
  postLikes     PostLike[]
  postVotes     PostVote[]
  commentVotes  CommentVote[]

  session Session[]
  key     Key[]

 */
