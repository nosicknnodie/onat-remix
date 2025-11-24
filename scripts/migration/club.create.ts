import { prisma } from "./prisma.db";

/**
model Club {
  id            String    @id @default(cuid())
  name          String    // 클럽 이름
  description   String?   @db.Text
  si            String?   // 도시
  gun           String?   // 지역
  imageId       String?   // 클럽 이미지
  emblemId      String?   // 엠블럼 URL
  image         File?      @relation("ClubImage",fields: [imageId], references: [id], onDelete: SetNull)
  emblem        File?      @relation("ClubEmblem",fields: [emblemId], references: [id], onDelete: SetNull)
  discordWebhook  String? // discord webhook 

  isPublic      Boolean?  @default(false)
  ownerUserId  String?
  ownerUser    User?      @relation("ClubOwnerUser",fields: [ownerUserId], references: [id], onDelete: SetNull)
  createUserId  String?
  createUser    User?     @relation("ClubCreateUser",fields: [createUserId], references: [id], onDelete: SetNull)
  players       Player[]      // 회원 선수
  matchClubs    MatchClub[]       // 매치
  mercenarys    Mercenary[]     // 용병
  boards        Board[]       // 게시판
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @default(now()) @updatedAt

  @@index([createUserId])

} 
 */

export const createClub = async () => {
  console.log("▶️ [createClub] lookup owner and existing club");
  const ownUser = await prisma.user.findUnique({ where: { email: "nosicknnodie@gmail.com" } });
  const isClub = await prisma.club.findFirst({ where: { name: "슈가FC" } });

  if (isClub) {
    console.log("ℹ️ [createClub] club already exists, skip creation");
    return;
  }
  const created = await prisma.club.create({
    data: {
      name: "슈가FC",
      description: "달달하게 축구합니다.",
      isPublic: true,
      ownerUserId: ownUser?.id,
      createUserId: ownUser?.id,
    },
  });
  console.log("✅ [createClub] created club", { id: created.id, name: created.name });
};
