import { matchSummaryRelations } from "~/features/matches/types";
import { prisma } from "~/libs/db/db.server";

export async function findMatchByIdWithClubs(id: string) {
  return await prisma.match.findUnique({
    where: { id },
    include: {
      matchClubs: {
        include: matchSummaryRelations,
      },
    },
  });
}

export async function updateMatch(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    stDate: Date;
    placeName?: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
    createUserId?: string;
  }>,
) {
  return await prisma.match.update({ where: { id }, data });
}
