import { prisma } from "~/libs/db/db.server";

export async function getQuartersWithGoals(matchClubId: string) {
  return await prisma.quarter.findMany({
    where: { matchClubId },
    orderBy: { order: "asc" },
    include: {
      team1: true,
      team2: true,
      goals: {
        include: {
          assigned: {
            include: {
              attendance: {
                include: {
                  player: { include: { user: { include: { userImage: true } } } },
                  mercenary: { include: { user: { include: { userImage: true } } } },
                },
              },
            },
          },
          assistAssigned: {
            include: {
              attendance: {
                include: {
                  player: { include: { user: { include: { userImage: true } } } },
                  mercenary: { include: { user: { include: { userImage: true } } } },
                },
              },
            },
          },
          team: true,
        },
      },
    },
  });
}

export async function getQuarterDetail(quarterId: string) {
  return await prisma.quarter.findUnique({
    where: { id: quarterId },
    include: {
      assigneds: {
        include: {
          team: true,
          attendance: {
            include: {
              mercenary: { include: { user: { include: { userImage: true } } } },
              player: { include: { user: { include: { userImage: true } } } },
            },
          },
        },
      },
    },
  });
}

export async function createGoal(data: {
  assignedId: string;
  assistAssignedId?: string;
  teamId?: string;
  quarterId: string;
  isOwnGoal?: boolean;
  goalType?: import("@prisma/client").GoalType;
}) {
  return await prisma.goal.create({ data });
}

export async function deleteGoal(id: string) {
  return await prisma.goal.delete({ where: { id } });
}
