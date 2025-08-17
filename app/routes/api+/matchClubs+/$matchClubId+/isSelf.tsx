import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";

const matchClubSchema = z.object({
  isSelf: z.boolean(),
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const data = await request.json();
  const result = matchClubSchema.safeParse(data);
  const matchClubId = params.matchClubId;
  if (!result.success) {
    return Response.json({ success: false, errors: result.error.flatten() }, { status: 400 });
  }
  const isSelf = result.data.isSelf;

  try {
    await prisma.$transaction(async (tx) => {
      const matchClub = await tx.matchClub.findUnique({
        where: {
          id: matchClubId,
        },
        include: {
          teams: true,
        },
      });
      if (!matchClub) throw new Error("매치클럽이 없습니다.");

      if (isSelf && matchClub.teams.length < 2) {
        const beforeTeam = await tx.matchClub.findFirst({
          where: {
            clubId: matchClub.clubId,
            isSelf: true,
          },
          orderBy: {
            match: {
              stDate: "desc",
            },
          },
          include: {
            teams: true,
          },
        });
        if (beforeTeam?.teams && beforeTeam?.teams?.length > 2) {
          await Promise.all(
            beforeTeam.teams.map((team) => {
              return tx.team.create({
                data: {
                  name: team.name,
                  color: team.color,
                  matchClubId: matchClub.id,
                },
              });
            }),
          );
        } else {
          await Promise.all([
            tx.team.create({
              data: {
                name: "Team A",
                color: "#000000",
                matchClubId: matchClub.id,
              },
            }),
            tx.team.create({
              data: {
                name: "Team B",
                color: "#ffffff",
                matchClubId: matchClub.id,
              },
            }),
          ]);
        }
      }
      const teams = await tx.team.findMany({
        where: {
          matchClubId: matchClub.id,
        },
      });
      await Promise.all([
        tx.matchClub.update({
          where: {
            id: matchClubId,
          },
          data: {
            isSelf: isSelf,
          },
        }),
        tx.quarter.updateMany({
          where: {
            matchClubId: matchClubId,
          },
          data: {
            isSelf: isSelf,
            ...(isSelf
              ? { team1Id: teams.at(0)?.id, team2Id: teams.at(1)?.id }
              : { team1Id: null, team2Id: null }),
          },
        }),
        tx.quarter.deleteMany({
          where: {
            matchClubId: matchClubId,
            order: {
              gt: 4,
            },
          },
        }),
        tx.assigned.deleteMany({
          where: {
            quarter: {
              matchClubId: matchClubId,
            },
          },
        }),
      ]);
    });

    return Response.json({ success: "success" });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
  }
};
