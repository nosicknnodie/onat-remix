import type { Prisma } from "@prisma/client";
import { PositionType } from "@prisma/client";
import { AES } from "~/libs/index.server";
import { supabase } from ".";
import { prisma } from "./prisma.db";

type LegacyMercenaryRow = {
  name: string | null;
  phone_num: string | null;
  prefer_position?: string | null;
  possible_positions?: string[] | null;
  is_used?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const normalizePhone = (phone?: string | null) => (phone ?? "").replace(/[^0-9]/g, "");
const normalizeName = (name?: string | null) => (name ?? "").trim().toLowerCase();
const isPositionType = (pos?: string | null): pos is PositionType =>
  Boolean(pos && Object.hasOwn(PositionType, pos));

export const mercenaryMigration = async () => {
  console.log("⏳ [mercenaryMigration] fetch mercenaries from supabase");
  const { data: mercenaries, error } = await supabase.from("player_mercenary").select("*");
  if (error) {
    console.error("player_mercenary select error - ", error);
    return;
  }

  const rows = (mercenaries ?? []) as LegacyMercenaryRow[];
  if (!rows.length) {
    console.log("ℹ️ [mercenaryMigration] no mercenaries to migrate");
    return;
  }

  console.log("⏳ [mercenaryMigration] lookup club and existing mercenaries");
  const club = await prisma.club.findFirst({ where: { name: "슈가FC" } });
  if (!club) {
    console.error("❌ [mercenaryMigration] club not found");
    return;
  }

  const existingMercenaries = await prisma.mercenary.findMany({
    where: { clubId: club.id },
    select: { id: true, name: true, hp: true },
  });

  const existingKeySet = new Set(
    existingMercenaries.map((mer) => {
      const plainHp = mer.hp ? AES.decrypt(mer.hp) : "";
      return `${normalizeName(mer.name)}__${normalizePhone(plainHp)}`;
    }),
  );

  const toCreate: Prisma.MercenaryCreateManyInput[] = [];
  let skippedExisting = 0;

  for (const row of rows) {
    if (!row.name) continue;
    if (row.is_used === false) continue;

    const nameKey = normalizeName(row.name);
    const phoneKey = normalizePhone(row.phone_num);
    const key = `${nameKey}__${phoneKey}`;

    if (existingKeySet.has(key)) {
      skippedExisting += 1;
      continue;
    }

    const positions = [row.prefer_position, ...(row.possible_positions ?? [])]
      .filter((pos): pos is string => Boolean(pos))
      .filter(isPositionType);
    const [position1, position2, position3] = positions;

    const encryptedHp = phoneKey ? AES.encrypt(phoneKey) : null;

    toCreate.push({
      clubId: club.id,
      name: row.name.trim(),
      hp: encryptedHp,
      position1: position1 ?? null,
      position2: position2 ?? null,
      position3: position3 ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });

    existingKeySet.add(key);
  }

  if (!toCreate.length) {
    console.log("ℹ️ [mercenaryMigration] nothing to create", {
      totalFetched: rows.length,
      skippedExisting,
    });
    return;
  }

  await prisma.mercenary.createMany({
    data: toCreate,
    skipDuplicates: true,
  });

  console.log("✅ [mercenaryMigration] completed", {
    created: toCreate.length,
    skippedExisting,
    totalFetched: rows.length,
  });
};
