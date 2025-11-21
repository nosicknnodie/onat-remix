import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useAttendanceQuery, useRecordGoalMutation } from "~/features/matches/isomorphic";

interface TeamShape {
  id: string;
  name: string;
}
interface QuarterShape {
  id: string;
  matchClubId: string;
  order: number;
  team1?: TeamShape | null;
  team2?: TeamShape | null;
}

interface RecordRegisterProps extends React.PropsWithChildren {
  quarter: QuarterShape;
  clubId: string;
  team?: TeamShape | null;
}

type AttendanceForRecord = {
  id: string;
  isVote: boolean;
  teamId?: string | null;
  assigneds?: { id: string; quarterId: string; teamId?: string | null }[];
  player: {
    user: { name?: string | null; userImage?: { url?: string | null } | null } | null;
  } | null;
  mercenary: {
    user?: { name?: string | null; userImage?: { url?: string | null } | null } | null;
    name?: string | null;
  } | null;
};

type QuarterAssignedForRecord = {
  id: string;
  quarterId: string;
  teamId?: string | null;
  attendance: { id: string };
};

export const RecordRegister = ({ children, quarter, clubId, team }: RecordRegisterProps) => {
  const [open, setOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<TeamShape | null>(team ?? quarter.team1 ?? null);
  const { mutateAsync: registerGoal, isPending } = useRecordGoalMutation(quarter.matchClubId);
  const { data: attendanceQueryData } = useAttendanceQuery(quarter.matchClubId, {
    enabled: open,
    clubId,
  });
  const { data: quarterDetail } = useQuery({
    queryKey: ["RECORD_QUARTER_ASSIGNED_QUERY", quarter.id],
    enabled: open,
    queryFn: async () => await fetch(`/api/quarters/${quarter.id}`).then((res) => res.json()),
  });

  const attendances =
    attendanceQueryData && "matchClub" in attendanceQueryData
      ? attendanceQueryData.matchClub.attendances
      : [];

  const assignedByAttendanceId = useMemo(() => {
    const quarterAssigneds =
      (quarterDetail?.quarter?.assigneds as QuarterAssignedForRecord[]) ?? [];
    const items = quarterAssigneds.map((item) => [item.attendance.id, item] as const);
    return new Map(items);
  }, [quarterDetail?.quarter?.assigneds]);

  const attendees = (attendances as AttendanceForRecord[])
    .filter((attendance) => attendance.isVote)
    .map((attendance) => {
      const assigned =
        attendance.assigneds?.find((item) => item.quarterId === quarter.id) ??
        assignedByAttendanceId.get(attendance.id);
      const assignedTeamId = assigned?.teamId ?? attendance.teamId ?? undefined;
      const name =
        attendance.player?.user?.name ||
        attendance.mercenary?.user?.name ||
        attendance.mercenary?.name ||
        "";
      const imageUrl =
        attendance.player?.user?.userImage?.url ||
        attendance.mercenary?.user?.userImage?.url ||
        "/images/user_empty.png";
      return { attendance, assigned, assignedTeamId, name, imageUrl };
    })
    .sort((a, b) => {
      if (a.assignedTeamId === b.assignedTeamId) return 0;
      return a.assignedTeamId === currentTeam?.id ? -1 : 1;
    });

  useEffect(() => {
    if (!open) return;
    if (team) {
      setCurrentTeam(team);
      return;
    }
    setCurrentTeam(quarter.team1 ?? null);
  }, [open, quarter.team1, team]);

  const handleOnTeamChange = (team: TeamShape | null) => setCurrentTeam(team);
  const handleAddGoal = async (goal: {
    attendanceId: string;
    teamId?: string | null;
    quarterId: string;
    isOwnGoal?: boolean;
  }) => {
    await registerGoal(goal);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-h-[50vh] max-h-[70vh] overflow-hidden p-2 sm:max-w-[600px]">
        <DialogHeader>
          <div className="text-lg font-bold mb-4 pb-2 border-b flex justify-between">
            <DialogTitle className="flex-1 flex justify-center items-center">
              {quarter.order} 쿼터
            </DialogTitle>
            {currentTeam && (
              <div className="flex flex-1 gap-2 justify-center items-center">
                <Button
                  size={"sm"}
                  variant={currentTeam?.id === quarter.team1?.id ? "default" : "outline"}
                  onClick={() => handleOnTeamChange(quarter.team1 ?? null)}
                >
                  {quarter.team1?.name}
                </Button>
                <Button
                  size={"sm"}
                  variant={currentTeam?.id === quarter.team2?.id ? "default" : "outline"}
                  onClick={() => handleOnTeamChange(quarter.team2 ?? null)}
                >
                  {quarter.team2?.name}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(70vh-96px)]">
          <ul className="space-y-2">
            {attendees.map(({ attendance, assigned, assignedTeamId, name, imageUrl }) => {
              const attendanceId = attendance?.id;
              return (
                <li
                  key={assigned?.id ?? attendanceId ?? name}
                  className="flex justify-between border-b"
                >
                  <div className="flex items-center gap-2 ">
                    <Avatar>
                      <AvatarImage src={imageUrl}></AvatarImage>
                      <AvatarFallback>
                        <Loading />
                      </AvatarFallback>
                    </Avatar>
                    <span>{name}</span>
                  </div>
                  <div className="px-4">
                    <Button
                      variant={currentTeam?.id === assignedTeamId ? "default" : "destructive"}
                      disabled={isPending || !attendanceId}
                      onClick={() =>
                        attendanceId &&
                        handleAddGoal({
                          attendanceId,
                          teamId: currentTeam?.id,
                          quarterId: quarter.id,
                          isOwnGoal: assignedTeamId ? currentTeam?.id !== assignedTeamId : false,
                        })
                      }
                    >
                      + {currentTeam?.id === assignedTeamId ? "골" : "자책골"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
