import { prisma } from "../db/db.server";

export const getRatingAttendances = async ({
  matchClubId,
}: {
  matchClubId: string;
}) => {
  const attendances = await prisma.attendance.findMany({
    where: {
      matchClubId: matchClubId,
      isVote: true,
    },
    include: {
      evaluations: true,
      assigneds: { include: { goals: { where: { isOwnGoal: false } } } },
      player: {
        // where: { status: "APPROVED" },
        include: { user: { include: { userImage: true } } },
      },
      mercenary: { include: { user: { include: { userImage: true } } } },
    },
  });
  return attendances;
};
