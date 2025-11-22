import { useNavigate, useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect } from "react";
import { FaCheck, FaInfoCircle, FaQuestionCircle, FaTimesCircle } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { useSession } from "~/contexts";
import {
  AttendanceGroupCard,
  AttendanceGroupCardContent,
  AttendanceGroupCardHeader,
  AttendanceGroupCardItem,
  AttendanceGroupCardTitle,
} from "~/features/matches/client";
import type { AttendanceClubPlayer, AttendanceRecord } from "~/features/matches/isomorphic";
import {
  EMPTY_ATTENDANCE_PLAYERS,
  EMPTY_ATTENDANCE_RECORDS,
  getAttendanceDisplayName,
  getPlayerDisplayName,
  useAttendanceMutation,
  useAttendanceQuery,
} from "~/features/matches/isomorphic";
import { useToast } from "~/hooks";
import { cn } from "~/libs";
import { getToastForError } from "~/libs/errors";

export const handle = {
  breadcrumb: () => {
    return <>참석</>;
  },
};

interface IAttendancePageProps {}

const AttendancePage = (_props: IAttendancePageProps) => {
  const params = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useSession();
  const matchClubId = params.matchClubId;
  const clubId = params.clubId;

  const attendanceQuery = useAttendanceQuery(matchClubId, {
    clubId: clubId ?? "",
    enabled: Boolean(matchClubId && clubId),
  });
  const attendanceMutation = useAttendanceMutation(matchClubId, { clubId: clubId ?? "" });

  useEffect(() => {
    if (attendanceQuery.data && "redirectTo" in attendanceQuery.data) {
      navigate(attendanceQuery.data.redirectTo);
    }
  }, [attendanceQuery.data, navigate]);

  const resolvedData =
    attendanceQuery.data && !("redirectTo" in attendanceQuery.data) ? attendanceQuery.data : null;
  const matchClub = resolvedData?.matchClub ?? null;
  const currentStatus = resolvedData?.currentStatus ?? "PENDING";
  const currentChecked = resolvedData?.currentChecked ?? "PENDING";
  const matchDate = matchClub ? new Date(matchClub.match.stDate) : null;
  const now = new Date();
  const isBeforeDay = matchDate ? now < dayjs(matchDate).subtract(1, "day").toDate() : false;
  const isCheckTimeOpen = matchDate ? now > dayjs(matchDate).subtract(2, "hour").toDate() : false;
  const matchClubAttendances = matchClub?.attendances ?? EMPTY_ATTENDANCE_RECORDS;
  const mercenaryAttendances = matchClub
    ? matchClubAttendances.filter((a) => !!a.mercenary && a.isVote)
    : EMPTY_ATTENDANCE_RECORDS;
  const attend: {
    ATTEND: AttendanceRecord[];
    ABSENT: AttendanceRecord[];
    PENDING: AttendanceClubPlayer[];
  } = matchClub
    ? {
        ATTEND: matchClubAttendances.filter((a) => !!a.player && a.isVote),
        ABSENT: matchClubAttendances.filter((a) => !!a.player && !a.isVote),
        PENDING: matchClub.club.players.filter(
          (p) =>
            p.userId && !matchClubAttendances.some((attendance) => attendance.playerId === p.id),
        ),
      }
    : {
        ATTEND: EMPTY_ATTENDANCE_RECORDS,
        ABSENT: EMPTY_ATTENDANCE_RECORDS,
        PENDING: EMPTY_ATTENDANCE_PLAYERS,
      };

  if (attendanceQuery.isLoading || !resolvedData || !matchClub || !matchClubId || !clubId) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  const statusIcons = {
    ATTEND: <MdEventAvailable className="text-primary" />,
    ABSENT: <FaTimesCircle className="text-destructive" />,
    PENDING: <FaQuestionCircle className="text-muted-foreground" />,
  } as const;

  const handleAttendanceChange = async (input: { isVote: boolean; isCheck: boolean }) => {
    try {
      await attendanceMutation.mutateAsync({ ...input });
    } catch (error) {
      toast(getToastForError(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className={cn("flex items-center gap-x-2 text-sm px-2")}>
            <FaInfoCircle className="text-muted-foreground" /> 현재 상태:{" "}
            <span
              className={cn("flex items-center gap-x-1", {
                "text-primary": currentStatus === "ATTEND",
                "text-destructive": currentStatus === "ABSENT",
                "text-muted-foreground": currentStatus === "PENDING",
              })}
            >
              {statusIcons[currentStatus as keyof typeof statusIcons]}
              {{ ATTEND: "참석", ABSENT: "불참", PENDING: "선택안함" }[currentStatus]}
            </span>
            {attendanceMutation.isPending && <Loading size={16} />}
          </div>
          {isCheckTimeOpen && currentStatus === "ATTEND" ? (
            <Button
              disabled={attendanceMutation.isPending || currentChecked === "CHECKED"}
              className={cn({ "bg-green-500": currentChecked === "CHECKED" })}
              onClick={() => handleAttendanceChange({ isCheck: true, isVote: true })}
            >
              {currentChecked === "CHECKED" ? "출석완" : "출석체크"}
            </Button>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {isBeforeDay ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-x-1 w-32"
                  disabled={attendanceMutation.isPending}
                  onClick={() => handleAttendanceChange({ isVote: true, isCheck: false })}
                >
                  {statusIcons.ATTEND} 참석
                  {currentStatus === "ATTEND" && <FaCheck className="text-primary" />}
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-x-1 w-32"
                  disabled={attendanceMutation.isPending}
                  onClick={() => handleAttendanceChange({ isVote: false, isCheck: false })}
                >
                  {statusIcons.ABSENT} 불참
                  {currentStatus === "ABSENT" && <FaCheck className="text-primary" />}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <AttendanceGroupCard className="bg-primary/5">
          <AttendanceGroupCardHeader>
            <AttendanceGroupCardTitle>
              {statusIcons.ATTEND} 참석: {attend.ATTEND.length + mercenaryAttendances.length}
              {mercenaryAttendances.length > 0 &&
                `(${attend.ATTEND.length}+${mercenaryAttendances.length})`}
              {currentStatus === "ATTEND" && <FaCheck className="text-primary" />}
            </AttendanceGroupCardTitle>
          </AttendanceGroupCardHeader>
          <AttendanceGroupCardContent>
            {attend.ATTEND.map((u) => (
              <AttendanceGroupCardItem
                key={u.id}
                className={cn({
                  "border-primary font-semibold text-primary": user?.id === u.player?.user?.id,
                })}
                isChecked={u.isCheck}
              >
                {getAttendanceDisplayName(u)}
              </AttendanceGroupCardItem>
            ))}
            {mercenaryAttendances.map((ma) => (
              <AttendanceGroupCardItem
                key={ma.id}
                className={cn({
                  "border-primary font-semibold text-primary": user?.id === ma.mercenary?.userId,
                })}
                isChecked={ma.isCheck}
              >
                {getAttendanceDisplayName(ma)}
              </AttendanceGroupCardItem>
            ))}
          </AttendanceGroupCardContent>
        </AttendanceGroupCard>

        <AttendanceGroupCard className="bg-destructive/5">
          <AttendanceGroupCardHeader>
            <AttendanceGroupCardTitle>
              {statusIcons.ABSENT} 불참: {attend.ABSENT.length}
              {currentStatus === "ABSENT" && <FaCheck className="text-primary" />}
            </AttendanceGroupCardTitle>
          </AttendanceGroupCardHeader>
          <AttendanceGroupCardContent>
            {attend.ABSENT.map((u) => (
              <AttendanceGroupCardItem
                key={u.id}
                className={cn({
                  "border-primary font-semibold text-primary": user?.id === u.player?.user?.id,
                })}
              >
                {getAttendanceDisplayName(u)}
              </AttendanceGroupCardItem>
            ))}
          </AttendanceGroupCardContent>
        </AttendanceGroupCard>

        <AttendanceGroupCard className="bg-muted-foreground/5">
          <AttendanceGroupCardHeader>
            <AttendanceGroupCardTitle>
              {statusIcons.PENDING} 선택안함: {attend.PENDING.length}
              {currentStatus === "PENDING" && <FaCheck className="text-primary" />}
            </AttendanceGroupCardTitle>
          </AttendanceGroupCardHeader>
          <AttendanceGroupCardContent>
            {attend.PENDING.map((u) => (
              <AttendanceGroupCardItem
                key={u.id}
                className={cn({
                  "border-primary font-semibold text-primary": user?.id === u.user?.id,
                })}
              >
                {getPlayerDisplayName({ nick: u.user?.nick, user: u.user })}
              </AttendanceGroupCardItem>
            ))}
          </AttendanceGroupCardContent>
        </AttendanceGroupCard>
      </div>
    </div>
  );
};

export default AttendancePage;
