import { Adapter } from "lucia";
import { prisma } from "./db.server";
import { redis } from "./redis.server";

export const adapter: Adapter = {
  getSessionAndUser: async (sessionId) => {
    // 1. Redis에서 먼저 세션 캐시 확인
    const cached = await redis.get(`session:${sessionId}`);
    if (cached) {
      const cachedData = JSON.parse(cached);
      cachedData.expiresAt = new Date(cachedData.expiresAt);

      let user = null;
      if (cachedData.user) {
        user = cachedData.user;
      } else {
        user = await prisma.user.findUnique({
          where: { id: cachedData.userId },
          include: {
            userImage: true,
          },
        });
        if (!user) return [null, null];
        // re-cache with user
        await redis.set(
          `session:${cachedData.id}`,
          JSON.stringify({
            ...cachedData,
            user,
          }),
          "EX",
          Math.floor((cachedData.expiresAt.getTime() - Date.now()) / 1000)
        );
      }
      const { id: userId, ...userAttributes } = user;

      return [
        {
          id: cachedData.id,
          userId: cachedData.userId,
          expiresAt: cachedData.expiresAt,
          attributes: {},
        },
        {
          id: userId,
          attributes: userAttributes,
        },
      ];
    }

    // 2. 캐시에 없으면 DB에서 세션 조회
    const dbSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!dbSession) return [null, null];

    // 유저 가져오기
    const user = await prisma.user.findUnique({
      where: { id: dbSession.userId },
      include: {
        userImage: true,
      },
    });

    if (!user) return [null, null];

    // Redis에 캐싱
    await redis.set(
      `session:${dbSession.id}`,
      JSON.stringify({
        ...dbSession,
        user,
      }),
      "EX",
      Math.floor((dbSession.expiresAt.getTime() - Date.now()) / 1000)
    );

    return [
      {
        ...dbSession,
        attributes: {},
      },
      {
        id: user.id,
        attributes: user,
      },
    ];
  },
  getUserSessions: async (userId) => {
    const sessions = await prisma.session.findMany({
      where: { userId },
    });
    return sessions.map((session) => ({
      ...session,
      attributes: {},
    }));
  },
  setSession: async (session) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { attributes, ...sessionData } = session;
    await prisma.session.create({
      data: sessionData,
    });

    await redis.set(
      `session:${session.id}`,
      JSON.stringify(session),
      "EX",
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
    );
  },
  updateSessionExpiration: async (sessionId, expiresAt) => {
    await prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt },
    });

    const cached = await redis.get(`session:${sessionId}`);
    if (cached) {
      const session = JSON.parse(cached);
      session.expiresAt = expiresAt;
      await redis.set(
        `session:${sessionId}`,
        JSON.stringify(session),
        "EX",
        Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      );
    }
  },
  deleteSession: async (sessionId) => {
    await prisma.session.delete({
      where: { id: sessionId },
    });
    await redis.del(`session:${sessionId}`);
  },
  deleteUserSessions: async (userId) => {
    const sessions = await prisma.session.findMany({
      where: { userId },
    });

    await prisma.session.deleteMany({
      where: { userId },
    });

    for (const session of sessions) {
      await redis.del(`session:${session.id}`);
    }
  },
  deleteExpiredSessions: async () => {
    const expiredSessions = await prisma.session.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    for (const session of expiredSessions) {
      await redis.del(`session:${session.id}`);
    }
  },
};

// Utility function to invalidate all Redis session cache entries for a user
export const invalidateUserSessionCache = async (userId: string) => {
  const sessions = await prisma.session.findMany({
    where: { userId },
  });

  for (const session of sessions) {
    await redis.del(`session:${session.id}`);
  }
};
