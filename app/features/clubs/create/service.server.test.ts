import type { Club, User } from "@prisma/client";
import { prisma } from "tests/setup";
import { beforeEach, describe, expect, it } from "vitest";
import { mockReset } from "vitest-mock-extended";
import { createClub } from "./service.server";
import type { CreateClubInput } from "./validators";

describe("createClub service", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  // schema.prisma에 맞게 모든 필수 필드를 포함하도록 mockUser를 수정합니다.
  const mockUser: User = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    emailVerified: new Date(),
    password: "hashed-password",
    role: "NORMAL",
    userImageId: null,
    playerNative: null,
    height: null,
    birth: null,
    gender: null,
    position1: null,
    position2: null,
    position3: null,
    si: null,
    gun: null,
    clothesSize: null,
    shoesSize: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInput: CreateClubInput = {
    name: "Test Club",
    description: "A club for testing",
    isPublic: true,
    si: "서울특별시",
    gun: "강남구",
    imageId: null,
    emblemId: null,
  };

  it("should create a club and a player as master in a transaction", async () => {
    // $transaction을 vi.Mock으로 타입 캐스팅하여 타입 에러를 해결합니다.
    prisma.$transaction.mockImplementation(async (callback) => {
      return await callback(prisma);
    });

    const mockCreatedClub: Club = {
      id: "club-1",
      name: mockInput.name,
      description: mockInput.description ?? null,
      si: mockInput.si ?? null,
      gun: mockInput.gun ?? null,
      imageId: mockInput.imageId ?? null,
      emblemId: mockInput.emblemId ?? null,
      isPublic: mockInput.isPublic ?? false,
      ownerUserId: mockUser.id,
      createUserId: mockUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.club.create.mockResolvedValue(mockCreatedClub);

    const result = await createClub({ input: mockInput, ownerUser: mockUser });

    expect(result).toEqual(mockCreatedClub);

    expect(prisma.club.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Test Club",
        ownerUserId: "user-1",
      }),
    });

    expect(prisma.player.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        clubId: "club-1",
        nick: "Test User",
        role: "MASTER",
      },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if club creation fails", async () => {
    const errorMessage = "Database error";
    prisma.$transaction.mockRejectedValue(new Error(errorMessage));

    await expect(createClub({ input: mockInput, ownerUser: mockUser })).rejects.toThrow(
      errorMessage,
    );
  });
});
