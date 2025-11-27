import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useNavigate, useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { Fragment, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiHelpCircle } from "react-icons/fi";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
} from "recharts";
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
  type ClubYearStatItem,
  useClubYearStats,
  useMembershipInfoQuery,
  usePlayerPermissionsQuery,
} from "~/features/clubs/isomorphic";
import {
  TeamAttendanceActions,
  TeamCard,
  TeamEditDialog,
  type UIAttendance,
} from "~/features/matches/client";
import {
  getAttendanceDisplayName,
  useAttendanceQuery,
  useTeamAssignmentMutation,
  useTeamQuery,
  useTeamUpdateMutation,
} from "~/features/matches/isomorphic";

type TeamStatsItem = {
  teamId: string;
  teamName: string;
  averageRating: string;
  totalRating: string;
  totalLike: number;
};

function TeamStatsCharts({
  year,
  teamStats,
  isLoading,
}: {
  year: string;
  teamStats?: TeamStatsItem[];
  isLoading: boolean;
}) {
  const chartData = teamStats ?? [];
  const colors = ["#2563eb", "#f59e0b", "#22c55e", "#ec4899", "#06b6d4", "#a855f7", "#ef4444"];

  return (
    <div className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-center items-center w-full">
            <span>팀별 연간 평점/총점/좋아요 ({year})</span>
            {isLoading && <Loading />}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 text-sm">
          {chartData.length > 0 ? (
            <>
              <div className="w-full">
                <p className="mb-2 text-sm font-semibold text-muted-foreground text-center">
                  평균 점수
                </p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                      <XAxis dataKey="teamName" tickLine={false} axisLine={false} />
                      <RechartTooltip />
                      <Bar
                        dataKey={"averageRating"}
                        name="평균 점수(별)"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={entry.teamId} fill={colors[index % colors.length]} />
                        ))}
                        <LabelList
                          dataKey={"averageRating"}
                          position="left"
                          formatter={(v: number) => v?.toFixed?.(3) ?? v}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="w-full">
                <p className="mb-2 text-sm font-semibold text-muted-foreground text-center">
                  총 점수
                </p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                      <XAxis dataKey="teamName" tickLine={false} axisLine={false} />
                      <RechartTooltip />
                      <Bar
                        dataKey={"totalRating"}
                        name="총 점수(별)"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={entry.teamId} fill={colors[index % colors.length]} />
                        ))}
                        <LabelList
                          dataKey={"totalRating"}
                          position="left"
                          formatter={(v: number) => v?.toFixed?.(2) ?? v}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className=" w-full">
                <p className="mb-2 text-sm font-semibold text-muted-foreground text-center">
                  좋아요
                </p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                      <XAxis dataKey="teamName" tickLine={false} axisLine={false} />
                      <RechartTooltip />
                      <Bar dataKey="totalLike" name="좋아요" radius={[4, 4, 0, 0]} barSize={18}>
                        {chartData.map((entry, index) => (
                          <Cell key={entry.teamId} fill={colors[index % colors.length]} />
                        ))}
                        <LabelList dataKey="totalLike" position="left" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">팀 통계가 없습니다.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UnassignedPlayers({
  notTeamAttendances,
  isTeamManageLocked,
  handleSelectedAtted,
}: {
  notTeamAttendances: UIAttendance[];
  isTeamManageLocked: boolean;
  handleSelectedAtted: (attendance: UIAttendance) => Promise<void> | void;
}) {
  return (
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
      <CardContent className="grid max-sm:grid-cols-2 sm:max-md:grid-cols-4 md:max-lg:grid-cols-4 lg:max-xl:grid-cols-5 xl:grid-cols-6 gap-2">
        {notTeamAttendances.map((attendance) => {
          return (
            <Fragment key={attendance.id}>
              <div className="px-2 py-1 space-x-2 flex items-center justify-center">
                <Checkbox
                  id={`checkbox-${attendance.id}`}
                  disabled={isTeamManageLocked}
                  onCheckedChange={() => handleSelectedAtted(attendance)}
                ></Checkbox>

                <Label htmlFor={`checkbox-${attendance.id}`} className="flex items-center gap-1">
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
                  <span>{getAttendanceDisplayName(attendance)}</span>
                </Label>
              </div>
            </Fragment>
          );
        })}
      </CardContent>
    </Card>
  );
}

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
  const { data: membership } = useMembershipInfoQuery(clubId ?? "", { enabled: Boolean(clubId) });
  const { data: permissions = [], isLoading: isPermissionLoading } = usePlayerPermissionsQuery(
    membership?.id ?? "",
    { enabled: Boolean(membership?.id) },
  );
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
  const matchStartDate = attendanceResult?.matchClub.match?.stDate;
  const manageWindowActive = matchStartDate
    ? dayjs().diff(dayjs(matchStartDate).add(3, "day"), "millisecond") <= 0
    : false;
  const hasMatchManage = permissions.includes("MATCH_MANAGE");
  const hasMatchMaster = permissions.includes("MATCH_MASTER");
  const canManageTeam = (hasMatchManage || hasMatchMaster) && manageWindowActive;
  const isTeamManageLocked = isPermissionLoading || !canManageTeam;
  const canShowTeamEdit = canManageTeam && !isPermissionLoading;
  const notTeamAttendances = attendances.filter(
    (attendance) => !attendance.teamId || !teams.some((team) => team.id === attendance.teamId),
  );
  const year = String(dayjs().year());
  const { data: yearData, isLoading: isYearLoading } = useClubYearStats(clubId, Number(year));

  const teamsWithAttendances = useMemo(
    () =>
      teams.map((team) => ({
        ...team,
        attendances: attendances.filter(
          (attendance) => attendance.teamId === team.id && attendance.isVote,
        ),
      })),
    [attendances, teams],
  );
  const [selectedAttends, setSelectedAttends] = useState<UIAttendance[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const teamAssignmentMutation = useTeamAssignmentMutation(matchClubId);
  const teamUpdateMutation = useTeamUpdateMutation(matchClubId);
  const playerYearDataMap = new Map<string, ClubYearStatItem>();
  yearData?.forEach((item) => {
    playerYearDataMap.set(item.playerId, item);
  });
  const teamStatsItems = teamsWithAttendances.map((team) => {
    const attendances = team.attendances;
    let totalStatsPlayerCount = 0;
    const totalRating = attendances.reduce((acc, cur) => {
      return acc + (playerYearDataMap.get(cur.playerId!)?.totalRating ?? 0);
    }, 0);
    const averageRating = attendances.reduce((acc, cur) => {
      const rating = playerYearDataMap.get(cur.playerId!)?.averageRating;
      if (rating) {
        totalStatsPlayerCount++;
        return acc + rating;
      } else return acc;
    }, 0);
    return {
      teamId: team.id,
      teamName: team.name,
      totalRating: (totalRating / 20).toFixed(2),
      averageRating: (averageRating / totalStatsPlayerCount / 20).toFixed(2),
      totalLike: attendances.reduce(
        (acc, cur) => acc + (playerYearDataMap.get(cur.playerId!)?.totalLike ?? 0),
        0,
      ),
    };
  });
  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      setSelectedTeamId(teams[0]?.id ?? null);
    }
  }, [selectedTeamId, teams]);
  // 팀없는 선수들 체크했을경우 attends 에 모아두기
  const handleSelectedAtted = async (attendance: UIAttendance) => {
    if (isTeamManageLocked) return;
    setSelectedAttends((prev) => {
      if (prev?.some((item) => item.id === attendance.id)) {
        return prev.filter((item) => item.id !== attendance.id);
      }
      return [...(prev ?? []), attendance];
    });
  };
  const handleAddTeam = async () => {
    if (isTeamManageLocked) return;
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
      {notTeamAttendances.length > 0 && (
        <div>
          <UnassignedPlayers
            notTeamAttendances={notTeamAttendances as UIAttendance[]}
            isTeamManageLocked={isTeamManageLocked}
            handleSelectedAtted={handleSelectedAtted}
          />
          <CardFooter className="flex flex-col sm:flex-row items-center gap-2">
            <Select
              value={selectedTeamId ?? undefined}
              onValueChange={setSelectedTeamId}
              disabled={isPending || isTeamManageLocked}
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
            <Button
              onClick={handleAddTeam}
              disabled={isPending || isTeamManageLocked}
              className="shrink-0"
            >
              <ArrowRightIcon className="mr-1" /> 이동
              {isPending && <Loading />}
            </Button>
          </CardFooter>
        </div>
      )}
      <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 gap-4">
        {teamsWithAttendances.map((team) => {
          return (
            <Fragment key={team.id}>
              <TeamCard
                team={team}
                headerAction={
                  canShowTeamEdit ? (
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
                  ) : null
                }
                renderAttendance={(attendance: UIAttendance | null) => (
                  <TeamAttendanceActions
                    name={getAttendanceDisplayName(attendance)}
                    imageUrl={
                      attendance?.player?.user?.userImage?.url ||
                      attendance?.mercenary?.user?.userImage?.url ||
                      "/images/user_empty.png"
                    }
                    isChecked={!!attendance?.isVote}
                    teams={teams.map((t) => ({ id: t.id, name: t.name }))}
                    currentTeamId={attendance?.teamId || null}
                    payload={{
                      player: attendance?.player || null,
                      mercenary: attendance?.mercenary || null,
                    }}
                    disabled={isTeamManageLocked}
                    disabledReason={
                      isPermissionLoading
                        ? "팀 이동 권한 확인 중입니다."
                        : manageWindowActive
                          ? "MATCH_MANAGE 권한이 필요합니다."
                          : "경기 시작 3일 이후에는 팀 이동이 불가합니다."
                    }
                    onSelectTeam={async (teamId) => {
                      if (isTeamManageLocked) return;
                      if (!attendance?.id) return;
                      await teamAssignmentMutation.mutateAsync({
                        teamId,
                        attendanceIds: [attendance.id],
                      });
                    }}
                  >
                    {getAttendanceDisplayName(attendance)}
                  </TeamAttendanceActions>
                )}
              />
            </Fragment>
          );
        })}
      </div>
      <TeamStatsCharts
        year={year}
        teamStats={teamStatsItems as TeamStatsItem[] | undefined}
        isLoading={isYearLoading}
      />
    </>
  );
};

export default TeamPage;
