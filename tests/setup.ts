import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

// 1. `db.server.ts`에서 export하는 prisma 인스턴스를 모킹합니다.
vi.mock("~/libs/db/db.server", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// 2. 각 테스트가 실행되기 전에 모킹된 데이터를 초기화합니다.
beforeEach(() => {
  mockReset(prisma);
});

// 3. 모킹된 prisma 인스턴스를 다른 테스트 파일에서 사용할 수 있도록 export 합니다.
export const prisma = mockDeep<PrismaClient>();
