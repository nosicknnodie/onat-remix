import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useNavigate, useParams } from "@remix-run/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiHelpCircle } from "react-icons/fi";
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
import {
  TeamAttendanceActions,
  TeamCard,
  TeamEditDialog,
  type UIAttendance,
} from "~/features/matches/client";
import {
  useAttendanceQuery,
  useTeamAssignmentMutation,
  useTeamQuery,
  useTeamUpdateMutation,
} from "~/features/matches/isomorphic";

export const handle = {
  breadcrumb: () => {
    return <>팀</>;
  },
};

interface ITeamPageProps {}

const TeamPage = (_props: ITeamPageProps) => {
  const params = useParams();
  const clubId = params.clubId;
  const matchClubId = params.matchClubId;
  const hasParams = Boolean(clubId && matchClubId);
  const navigate = useNavigate();
  useEffect(() => {
    if (!hasParams) {
      navigate("/clubs");
    }
  }, [hasParams, navigate]);
  const teamQuery = useTeamQuery(matchClubId, {
    clubId,
    enabled: hasParams,
  });
  const attendanceQuery = useAttendanceQuery(matchClubId, {
    clubId,
    enabled: hasParams,
  });
  useEffect(() => {
    if (attendanceQuery.data && "redirectTo" in attendanceQuery.data) {
      navigate(attendanceQuery.data.redirectTo);
    }
  }, [attendanceQuery.data, navigate]);
  useEffect(() => {
    if (teamQuery.data && "redirectTo" in teamQuery.data) {
      navigate(teamQuery.data.redirectTo);
    }
  }, [navigate, teamQuery.data]);
  const teamResult = teamQuery.data && !("redirectTo" in teamQuery.data) ? teamQuery.data : null;
  const teams = teamResult?.teams ?? [];
  const attendanceResult =
    attendanceQuery.data && !("redirectTo" in attendanceQuery.data) ? attendanceQuery.data : null;
  const attendances = attendanceResult?.matchClub.attendances ?? [];
  const notTeamAttendances = attendances.filter(
    (attendance) => !attendance.teamId || !teams.some((team) => team.id === attendance.teamId),
  );
  const teamsWithAttendances = useMemo(
    () =>
      teams.map((team) => ({
        ...team,
        attendances: attendances.filter((attendance) => attendance.teamId === team.id),
      })),
    [attendances, teams],
  );
  const [selectedAttends, setSelectedAttends] = useState<UIAttendance[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const teamAssignmentMutation = useTeamAssignmentMutation(matchClubId);
  const teamUpdateMutation = useTeamUpdateMutation(matchClubId);
  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      setSelectedTeamId(teams[0]?.id ?? null);
    }
  }, [selectedTeamId, teams]);
  // 팀없는 선수들 체크했을경우 attends 에 모아두기
  const handleSelectedAtted = async (attendance: UIAttendance) => {
    setSelectedAttends((prev) => {
      if (prev?.some((item) => item.id === attendance.id)) {
        return prev.filter((item) => item.id !== attendance.id);
      }
      return [...(prev ?? []), attendance];
    });
  };
  const handleAddTeam = async () => {
    if (!selectedTeamId || selectedAttends?.length <= 0) return;
    await teamAssignmentMutation.mutateAsync({
      teamId: selectedTeamId,
      attendanceIds: selectedAttends.map((item) => item.id),
    });
    setSelectedAttends([]);
  };
  const isPending = teamAssignmentMutation.isPending;
  if (!hasParams) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }
  const isAttendanceLoading = attendanceQuery.isLoading && !attendanceResult;
  const isTeamLoading = teamQuery.isLoading && !teamResult;

  if (isAttendanceLoading || isTeamLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

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
                value={selectedTeamId ?? undefined}
                onValueChange={setSelectedTeamId}
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
        {teamsWithAttendances.map((team) => {
          return (
            <Fragment key={team.id}>
              <TeamCard
                team={team}
                headerAction={
                  <TeamEditDialog
                    payload={team}
                    onUpdate={async (teamId, data) => {
                      try {
                        const nextName = data.name ?? team.name ?? "";
                        const nextColor = data.color ?? team.color ?? "#000000";
                        await teamUpdateMutation.mutateAsync({
                          teamId,
                          name: nextName,
                          color: nextColor,
                        });
                        return true;
                      } catch {
                        return false;
                      }
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="팀 수정"
                      className="bg-transparent shadow-none drop-shadow-none ring-0 focus:ring-0 outline-none"
                    >
                      <FiEdit2 />
                    </Button>
                  </TeamEditDialog>
                }
                renderAttendance={(attendance: UIAttendance | null) => (
                  <TeamAttendanceActions
                    name={
                      attendance?.player?.user?.name ||
                      attendance?.mercenary?.user?.name ||
                      attendance?.mercenary?.name ||
                      ""
                    }
                    imageUrl={
                      attendance?.player?.user?.userImage?.url ||
                      attendance?.mercenary?.user?.userImage?.url ||
                      "/images/user_empty.png"
                    }
                    isChecked={!!attendance?.isCheck}
                    teams={teams.map((t) => ({ id: t.id, name: t.name }))}
                    currentTeamId={attendance?.teamId || null}
                    payload={{
                      player: attendance?.player || null,
                      mercenary: attendance?.mercenary || null,
                    }}
                    onSelectTeam={async (teamId) => {
                      if (!attendance?.id) return;
                      await teamAssignmentMutation.mutateAsync({
                        teamId,
                        attendanceIds: [attendance.id],
                      });
                    }}
                  >
                    {attendance?.player?.user?.name ||
                      attendance?.mercenary?.user?.name ||
                      attendance?.mercenary?.name}
                  </TeamAttendanceActions>
                )}
              />
            </Fragment>
          );
        })}
      </div>
    </>
  );
};

export default TeamPage;
