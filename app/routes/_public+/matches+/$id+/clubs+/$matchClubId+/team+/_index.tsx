import { Attendance, File, Mercenary, Player, Team, User } from "@prisma/client";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { ComponentProps, Fragment, useState, useTransition } from "react";
import { AiFillSkin } from "react-icons/ai";
import { FiEdit, FiHelpCircle } from "react-icons/fi";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { prisma } from "~/libs/db/db.server";
import EditDialog from "./_EditDialog";
import { TeamAttendanceActions } from "./_actions";

/**
 * [LOGIC]
 * 1. 해당 매치가 isSelf일경우만
 * 2. 매치에 팀이 생성되지 않은경우
 * 3. 해당 클럽내의 이전 팀정보가 있는경우 이전 팀 정보에서 정보 가져오기
 * 4. 이전 팀 정보의 내용을 토대로 팀을 생성
 * 5. 최소 2개의 팀을 생성해야함
 */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
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
              include: {
                player: { include: { user: { include: { userImage: true } } } },
                mercenary: { include: { user: { include: { userImage: true } } } },
              },
            },
          },
        },
      },
    });

    if (!matchClubId || !matchClub || !matchClub.isSelf)
      return redirect("/matches/" + matchId + "/clubs/" + matchClubId);
    const teams = matchClub.teams;
    const attendances = matchClub.attendances;
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
      await fetch("/api/attendances/team", {
        method: "POST",
        body: JSON.stringify({
          teamId: selectedTeamId,
          attendanceIds: selectedAttends.map((item) => item.id),
        }),
      });
      setSelectedAttends([]);
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
              <CardTitle className="flex justify-start gap-2 items-center">
                <p>아직 팀이 없는 선수들</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <FiHelpCircle />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-4 space-y-2 bg-muted text-sm text-muted-foreground rounded-md shadow-lg border">
                      <p>팀 구분은 스쿼트 편의를 위한것입니다.</p>
                      <p>1. 각 팀으로 이동시켜주세요.</p>
                      <p>2. 선수들 체크하고 팀을 선택후 이동 버튼을 눌러주세요.</p>
                      <p>3. 이동후에 개별적으로 이동시킬 수 있습니다.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex">
              {notTeamAttendances.map((attendance) => {
                return (
                  <Fragment key={attendance.id}>
                    <div className="px-2 py-1 space-x-2 flex items-center justify-center">
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
            <CardFooter className="flex flex-col sm:flex-row items-center gap-2">
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
              <Button onClick={handleAddTeam} disabled={isPending} className="shrink-0">
                <ArrowRightIcon className="mr-1" /> 이동
                {isPending && <Loading />}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 gap-4">
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

export interface IAttendance extends Attendance {
  player: (Player & { user: (User & { userImage: File | null }) | null }) | null;
  mercenary: (Mercenary & { user: (User & { userImage: File | null }) | null }) | null;
}

interface ITeamCardProps extends ComponentProps<typeof Card> {
  team:
    | (Team & {
        attendances?: (IAttendance | null)[];
      })
    | null;
}

const TeamCard = ({ team }: ITeamCardProps) => {
  return (
    <>
      <Card style={{ backgroundColor: team?.color ? `${team?.color}0D` : undefined }}>
        <CardHeader>
          <CardTitle className="flex gap-2 justify-between items-center">
            <div className="flex gap-2 items-center">
              <AiFillSkin color={team?.color} className="drop-shadow" />
              <span className="text-lg">{team?.name}</span>
              <span className="text-muted-foreground text-sm">({team?.attendances?.length})</span>
            </div>
            <EditDialog payload={team}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="팀 수정"
                className="bg-transparent shadow-none drop-shadow-none ring-0 focus:ring-0 outline-none"
              >
                <FiEdit />
              </Button>
            </EditDialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-4 max-lg:grid-cols-3 gap-2">
            {team?.attendances?.map((attendance) => {
              return (
                <Fragment key={attendance?.id}>
                  <TeamAttendanceActions payload={attendance}>
                    {attendance?.player?.user?.name ||
                      attendance?.mercenary?.user?.name ||
                      attendance?.mercenary?.name}
                  </TeamAttendanceActions>
                </Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TeamPage;
