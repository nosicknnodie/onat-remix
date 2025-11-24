import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

// 개발 환경에서는 서버를 재시작하지 않고도 변경사항을 적용하기 위해
// 전역 변수에 Prisma 클라이언트를 저장합니다.
// 이렇게 하면 매 변경마다 새로운 DB 연결을 생성하지 않아도 됩니다.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
  console.log("[prisma] client created (production)");
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
    console.log("[prisma] client created (dev)");
  }
  prisma = global.__db__;
  prisma.$connect();
  console.log("[prisma] connected (dev)");
}

// Prisma 클라이언트와 모델들을 export 합니다
export { prisma };
export const { session, key, user } = prisma;
