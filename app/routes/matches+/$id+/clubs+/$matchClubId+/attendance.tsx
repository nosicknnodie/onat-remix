import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const matchClubId = params.matchClubId;
  const matchClub = await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    include: {
      club: {
        include: {
          image: true,
          emblem: true,
          players: {
            where: { status: "APPROVED" },
            include: { user: { include: { userImage: true } } },
          },
        },
      },
      attendances: true,
      teams: true,
    },
  });

  if (!matchClub) return redirect("/matches/" + matchClubId);

  const [currentPlayer, currentMercenary] = await Promise.all([
    prisma.player.findFirst({
      where: {
        userId: user?.id,
        clubId: matchClub?.clubId,
      },
    }),
    prisma.mercenary.findFirst({
      where: {
        userId: user?.id,
        clubId: matchClub?.clubId,
        attendance: {
          some: {
            matchClubId: matchClubId,
          },
        },
      },
    }),
  ]);

  if (!currentPlayer && !currentMercenary) {
    return redirect("/matches/" + matchClubId);
  }

  return Response.json({ matchClub });
};

interface IAttendancePageProps {}

const AttendancePage = (_props: IAttendancePageProps) => {
  return <>AttendancePage</>;
};

export default AttendancePage;
