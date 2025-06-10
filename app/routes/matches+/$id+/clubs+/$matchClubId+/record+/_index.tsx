import { Quarter, Team } from "@prisma/client";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { FaFutbol } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";
import { RightDrawer } from "./_Drawer";
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId;
  const quarters = await prisma.quarter.findMany({
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
                  player: {
                    include: {
                      user: {
                        include: { userImage: true },
                      },
                    },
                  },
                  mercenary: {
                    include: {
                      user: {
                        include: { userImage: true },
                      },
                    },
                  },
                },
              },
            },
          },
          assistAssigned: {
            include: {
              attendance: {
                include: {
                  player: {
                    include: {
                      user: {
                        include: { userImage: true },
                      },
                    },
                  },
                  mercenary: {
                    include: {
                      user: {
                        include: { userImage: true },
                      },
                    },
                  },
                },
              },
            },
          },
          team: true,
        },
      },
    },
  });
  return { quarters };
};

interface IRecordPageProps {}

const RecordPage = (_props: IRecordPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const quarters = loaderData.quarters;
  return (
    <>
      <div>
        {quarters.map((quarter, index) => {
          const isSameTeam1 =
            index > 0 ? quarter.team1Id === quarters[index - 1].team1Id : false;
          const isSameTeam2 =
            index > 0 ? quarter.team2Id === quarters[index - 1].team2Id : false;
          const team1Goals = quarter.goals
            .filter((goal) => {
              return goal.teamId === quarter.team1Id || !quarter.team1Id;
            })
            .map((goal) => {
              const name =
                goal.assigned.attendance.player?.user?.name ||
                goal.assigned.attendance.mercenary?.user?.name ||
                goal.assigned.attendance.mercenary?.name ||
                "";
              const imageUrl =
                goal.assigned.attendance.player?.user?.userImage?.url ||
                goal.assigned.attendance.mercenary?.user?.userImage?.url ||
                "";
              return (
                <GoalComponent
                  key={goal.id}
                  name={name}
                  imageUrl={imageUrl}
                  isOwner={goal.isOwnGoal}
                />
              );
            });
          const team2Goals = quarter.goals
            .filter((goal) => {
              return goal.teamId === quarter.team2Id;
            })
            .map((goal) => {
              const name =
                goal.assigned.attendance.player?.user?.name ||
                goal.assigned.attendance.mercenary?.user?.name ||
                goal.assigned.attendance.mercenary?.name ||
                "";
              const imageUrl =
                goal.assigned.attendance.player?.user?.userImage?.url ||
                goal.assigned.attendance.mercenary?.user?.userImage?.url ||
                "";
              return (
                <GoalComponent
                  key={goal.id}
                  name={name}
                  imageUrl={imageUrl}
                  isOwner={goal.isOwnGoal}
                />
              );
            });
          return (
            <QuarterRecordComponent
              key={quarter.id}
              quarter={quarter}
              end={index === quarters.length - 1}
              isSameTeam1={isSameTeam1}
              isSameTeam2={isSameTeam2}
              team1Content={team1Goals}
              team2Content={team2Goals}
            />
          );
        })}
      </div>
    </>
  );
};

interface IQuarterRecordComponentProps {
  end?: boolean;
  isSameTeam1?: boolean;
  isSameTeam2?: boolean;
  team1Content?: React.ReactNode;
  team2Content?: React.ReactNode;
  quarter: Quarter & { team1?: Team | null; team2?: Team | null };
}

const QuarterRecordComponent = ({
  end,
  quarter,
  isSameTeam1,
  isSameTeam2,
  team1Content,
  team2Content,
}: IQuarterRecordComponentProps) => {
  return (
    <>
      <div className="flex justify-between relative w-full">
        <RightDrawer quarterId={quarter.id}>
          <Button
            variant="ghost"
            className="absolute z-20 top-4 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-primary text-white font-semibold drop-shadow-md rounded-full w-8 h-8 text-xs flex items-center justify-center"
          >
            {quarter.order}
          </Button>
        </RightDrawer>
        {!isSameTeam1 && (
          <div className="absolute top-4 left-1/2 -translate-x-full -translate-y-1/2 flex items-center justify-center pr-16 font-semibold drop-shadow-sm">
            {quarter.team1?.name}
          </div>
        )}
        {!isSameTeam2 && (
          <div className="absolute top-4 left-1/2 translate-x-0 -translate-y-1/2 flex items-center justify-center pl-16 font-semibold drop-shadow-sm">
            {quarter.team2?.name}
          </div>
        )}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-secondary w-1 h-[calc(100%-3rem)] rounded-md"></div>
        <div className="mt-10 w-1/2 flex flex-col items-end pb-2 pr-8 text-sm min-h-16">
          {team1Content}
        </div>
        <div className="mt-10 w-1/2 flex flex-col items-start pb-2 text-sm pl-8 min-h-16">
          {team2Content}
        </div>
        {end && (
          <div className="absolute bottom-0 left-1/2 translate-y-full -translate-x-1/2 bg-secondary text-white font-semibold drop-shadow-md rounded-full w-8 h-8 text-xs flex items-center justify-center">
            종료
          </div>
        )}
      </div>
    </>
  );
};

const GoalComponent = ({
  name,
  imageUrl,
  isOwner,
}: {
  name: string;
  imageUrl?: string;
  isOwner?: boolean;
}) => {
  return (
    <>
      <div className="flex items-center gap-1">
        <Avatar className="size-4">
          <AvatarImage src={imageUrl || "/images/user_empty.png"} />
          <AvatarFallback className="bg-primary-foreground">
            <Loading className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        {name}{" "}
        <FaFutbol
          className={cn("text-primary", {
            "text-destructive": isOwner,
          })}
        />
      </div>
    </>
  );
};

export default RecordPage;
