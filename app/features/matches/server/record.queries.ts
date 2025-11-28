import { prisma } from "~/libs/server";

export async function getQuartersWithRecords(matchClubId: string) {
  return await prisma.quarter.findMany({
    where: { matchClubId },
    orderBy: { order: "asc" },
    include: {
      team1: true,
      team2: true,
      records: {
        include: {
          attendance: {
            include: {
              player: { include: { user: { include: { userImage: true } } } },
              mercenary: { include: { user: { include: { userImage: true } } } },
            },
          },
          assistAttendance: {
            include: {
              player: { include: { user: { include: { userImage: true } } } },
              mercenary: { include: { user: { include: { userImage: true } } } },
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
      records: {
        include: {
          attendance: {
            include: {
              mercenary: { include: { user: { include: { userImage: true } } } },
              player: { include: { user: { include: { userImage: true } } } },
            },
          },
          assistAttendance: {
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

export async function createRecord(data: {
  attendanceId: string;
  assistAttendanceId?: string;
  teamId?: string;
  quarterId: string;
  isOwnGoal?: boolean;
  goalType?: import("@prisma/client").GoalType;
}) {
  return await prisma.record.create({ data });
}

export async function deleteRecord(id: string) {
  return await prisma.record.delete({ where: { id } });
}

export async function findRecordById(id: string) {
  return await prisma.record.findUnique({
    where: { id },
    select: {
      attendanceId: true,
      assistAttendanceId: true,
    },
  });
}
