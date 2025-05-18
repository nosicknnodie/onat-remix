import { Attendance, File, Player, Team, User } from "@prisma/client";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { ComponentProps, Fragment, useState, useTransition } from "react";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  /**
   * [LOGIC]
   * 1. 해당 매치가 isSelf일경우만
   * 2. 매치에 팀이 생성되지 않은경우
   * 3. 해당 클럽내의 이전 팀정보가 있는경우 이전 팀 정보에서 정보 가져오기
   * 4. 이전 팀 정보의 내용을 토대로 팀을 생성
   * 5. 최소 2개의 팀을 생성해야함
   */
  const matchId = params.id;
  const matchClubId = params.matchClubId;
  try {
    const matchClub = await prisma.matchClub.findUnique({
      where: {
        id: matchClubId,
      },
      include: {
        attendances: {
          where: {
            isVote: true,
          },
          include: {
            player: { include: { user: { include: { userImage: true } } } },
            mercenary: { include: { user: { include: { userImage: true } } } },
          },
        },
        teams: {
          include: {
            attendances: {
              where: {
                isVote: true,
              },
              include: { player: { include: { user: { include: { userImage: true } } } } },
            },
          },
        },
      },
    });

    if (!matchClubId || !matchClub)
      return redirect("/matches/" + matchId + "/clubs/" + matchClubId);
    const teams = matchClub.teams;
    const attendances = matchClub.attendances;
    if (teams.length < 2) {
      const newTeam = await prisma.$transaction(async (tx) => {
        let teams = null;
        const beforeTeam = await tx.matchClub.findFirst({
          where: {
            clubId: matchClub?.clubId,
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
          teams = await Promise.all(
            beforeTeam.teams.map((team) => {
              return tx.team.create({
                data: {
                  name: team.name,
                  color: team.color,
                  matchClubId: matchClubId,
                },
              });
            }),
          );
        } else {
          teams = await Promise.all([
            tx.team.create({
              data: {
                name: "Team A",
                color: "#000000",
                matchClubId: matchClubId,
              },
            }),
            tx.team.create({
              data: {
                name: "Team B",
                color: "#ffffff",
                matchClubId: matchClubId,
              },
            }),
          ]);
        }
        return teams;
      });
      return { teams: newTeam, attendances };
    }
    return { teams, attendances };
  } catch {
    return redirect("/matches/" + matchId + "/clubs/" + matchClubId);
  }
};

interface ITeamPageProps {}

const TeamPage = (_props: ITeamPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const teams = loaderData.teams;
  const attendances = loaderData.attendances;
  const notTeamAttendances = attendances.filter(
    (attendance) => !teams.some((team) => team.id === attendance.teamId),
  );
  const [isPending, startTransition] = useTransition();
  const [selectedAttends, setSelectedAttends] = useState<typeof attendances>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams?.[0]?.id ?? null);

  // 팀없는 선수들 체크했을경우 attends 에 모아두기
  const handleSelectedAtted = async (attendance: (typeof attendances)[number]) => {
    setSelectedAttends((prev) => {
      if (prev?.some((item) => item.id === attendance.id)) {
        return prev.filter((item) => item.id !== attendance.id);
      }
      return [...(prev ?? []), attendance];
    });
  };
  const handleAddTeam = async () => {
    if (!selectedTeamId || selectedAttends?.length <= 0) return;
    startTransition(async () => {
      await fetch("/api/team", {
        method: "POST",
        body: JSON.stringify({
          teamId: selectedTeamId,
          attendanceIds: selectedAttends.map((item) => item.id),
        }),
      });
      revalidate();
    });
  };

  return (
    <>
      {/* <div className="flex justify-end">
        <Button asChild>
          <Link to={"./new"}>팀생성</Link>
        </Button>
      </div> */}
      {notTeamAttendances.length > 0 && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>아직 팀이 없는 선수들</CardTitle>
              <CardDescription>
                각 팀으로 이동시켜주세요. 선수들 체크하고 팀을 선택후 이동 버튼을 눌러주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex">
              {notTeamAttendances.map((attendance) => {
                return (
                  <Fragment key={attendance.id}>
                    <div className="px-2 py-1 space-x-1 flex items-center justify-center">
                      <Checkbox
                        id={`checkbox-${attendance.id}`}
                        onCheckedChange={() => handleSelectedAtted(attendance)}
                      ></Checkbox>

                      <Label
                        htmlFor={`checkbox-${attendance.id}`}
                        className="flex items-center gap-1"
                      >
                        <Avatar className="size-5">
                          <AvatarImage
                            src={
                              attendance.player?.user?.userImage?.url ||
                              attendance.mercenary?.user?.userImage?.url ||
                              "/images/user_empty.png"
                            }
                          />
                          <AvatarFallback className="bg-primary-foreground">
                            <Loading />
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {attendance.player?.user?.name ||
                            attendance.mercenary?.user?.name ||
                            attendance.mercenary?.name}
                        </span>
                      </Label>
                    </div>
                  </Fragment>
                );
              })}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Select
                defaultValue={teams?.[0]?.id}
                onValueChange={(value) => setSelectedTeamId(value)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => {
                    return (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button onClick={handleAddTeam} disabled={isPending}>
                + 이동
                {isPending && <Loading />}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {teams?.map((team) => {
          return (
            <Fragment key={team.id}>
              <TeamCard team={team} />
            </Fragment>
          );
        })}
      </div>
    </>
  );
};

interface ITeamCardProps extends ComponentProps<typeof Card> {
  team:
    | (Team & {
        attendances?: (
          | (Attendance & {
              player: (Player & { user: (User & { userImage: File | null }) | null }) | null;
            })
          | null
        )[];
      })
    | null;
}

const TeamCard = ({ team }: ITeamCardProps) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{team?.name}</CardTitle>
          {/* <CardDescription>
            {team?.color} {team?.seq}
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          {team?.attendances?.map((attendance) => {
            return (
              <div key={attendance?.id}>
                {attendance?.player?.user?.name}({attendance?.player?.nick})
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
};

export default TeamPage;
