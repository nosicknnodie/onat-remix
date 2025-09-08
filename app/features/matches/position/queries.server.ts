import { prisma } from "~/libs/db/db.server";

export async function findMatchClubWithQuartersAndTeams(matchClubId: string) {
  return await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    include: { quarters: { include: { team1: true, team2: true } }, teams: true },
  });
}

export async function findMatchClubWithQuartersTeamsAttendances(matchClubId: string) {
  return await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    include: {
      quarters: { include: { team1: true, team2: true } },
      teams: true,
      attendances: {
        where: { isVote: true },
        include: {
          assigneds: true,
          player: { include: { user: { include: { userImage: true } } } },
          mercenary: { include: { user: { include: { userImage: true } } } },
        },
      },
    },
  });
}

export async function createQuarter(matchClubId: string, order: number) {
  return await prisma.$transaction(async (tx) => {
    const matchClub = await tx.matchClub.findUnique({
      where: { id: matchClubId },
      include: { quarters: true, teams: true },
    });
    if (!matchClub) throw new Error("matchClub not found");
    if (matchClub.quarters.some((q) => q.order === order))
      throw new Error("Quarter already exists");
    await tx.quarter.create({
      data: {
        matchClubId,
        isSelf: matchClub.isSelf,
        order,
        ...(matchClub.isSelf && { team1Id: matchClub.teams[0].id, team2Id: matchClub.teams[1].id }),
      },
    });
    return { ok: true as const };
  });
}

export async function createAssigned(data: {
  attendanceId: string;
  quarterId: string;
  position: import("@prisma/client").PositionType;
  teamId?: string | null;
}) {
  return await prisma.assigned.create({ data });
}

export async function updateAssigned(
  id: string,
  data: {
    attendanceId: string;
    quarterId: string;
    position: import("@prisma/client").PositionType;
    teamId?: string | null;
  },
) {
  return await prisma.assigned.update({ where: { id }, data });
}

export async function deleteAssigned(id: string) {
  return await prisma.assigned.delete({ where: { id } });
}

export async function findAssignedByPosition(
  quarterId: string,
  teamId: string | null,
  position: import("@prisma/client").PositionType,
) {
  return await prisma.assigned.findFirst({ where: { quarterId, teamId, position } });
}

export async function findAssignedById(id: string) {
  return await prisma.assigned.findUnique({ where: { id } });
}
