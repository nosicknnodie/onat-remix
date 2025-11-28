import Redis from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
  password: process.env.REDIS_PASSWORD,
};

export const redis = new Redis(redisConfig);
