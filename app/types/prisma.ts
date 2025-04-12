import type { PrismaClient } from "@prisma/client";

declare global {
  var __db__: PrismaClient;
}

export interface IDatabase {
  prisma: PrismaClient;
  session: PrismaClient["session"];
  key: PrismaClient["key"];
  user: PrismaClient["user"];
}
