import { useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Loading } from "~/components/Loading";
import { Separator } from "~/components/ui/separator";
import {
  type AttendanceSummaryItem,
  CheckInSection,
  type PendingSummaryItem,
  PostMatchSection,
  PreMatchSection,
} from "~/features/matches/client";
import {
  useAttendanceMutation,
  useAttendanceQuery,
  useMatchClubQuery,
  useRatingQuery,
  useRecordQuery,
} from "~/features/matches/isomorphic";
import { useToast } from "~/hooks";
import { getToastForError } from "~/libs/errors";

export const handle = {
  breadcrumb: () => {
    return <>정보</>;
  },
};

interface IMatchClubIdPageProps {}

type NameSource = {
  player?: {
    id?: string;
    userId?: string | null;
    user?: { name?: string | null; userImage?: { url?: string | null } | null } | null;
    nick?: string | null;
  } | null;
  mercenary?: {
    id?: string;
    name?: string | null;
    userId?: string | null;
    user?: { name?: string | null; userImage?: { url?: string | null } | null } | null;
  } | null;
};

type PreMatchAttendance = NameSource & {
  id: string;
  isVote: boolean;
  playerId?: string | null;
};

type PreMatchPlayer = NameSource["player"] & {
  id: string;
};

const getAttendanceDisplayName = (attendance: NameSource) =>
  attendance.player?.user?.name ??
  attendance.player?.nick ??
  attendance.mercenary?.user?.name ??
  attendance.mercenary?.name ??
  "";

const getPendingPlayerName = (player: PreMatchPlayer) => player.user?.name ?? player.nick ?? "";

const MatchClubIdPage = (_props: IMatchClubIdPageProps) => {
  const params = useParams();
  const matchClubId = params.matchClubId;
  const clubId = params.clubId;
  const { toast } = useToast();
  const { data: matchClubQueryData, isLoading: isMatchClubLoading } = useMatchClubQuery(
    matchClubId,
    {
      clubId,
      enabled: Boolean(matchClubId),
    },
  );
  const matchClub = matchClubQueryData?.matchClub ?? null;
  const match = matchClub?.match ?? null;
  const matchStartDate = match?.stDate;
  const matchStart = matchStartDate ? dayjs(matchStartDate) : null;
  const now = dayjs();
  const attendanceVoteCloseTime = matchStart ? matchStart.subtract(1, "day") : null;
  const attendanceListCloseTime = matchStart ? matchStart.subtract(2, "hour") : null;
  const checkWindowOpen = attendanceListCloseTime;
  const checkWindowClose = matchStart ? matchStart.add(4, "hour") : null;
  const recordVisibleTime = matchStart ? matchStart.add(2, "hour") : null;
  const canVoteAttendance =
    Boolean(matchStart) && attendanceVoteCloseTime ? !now.isAfter(attendanceVoteCloseTime) : false;
  const showAttendanceList =
    Boolean(matchStart) && attendanceListCloseTime ? !now.isAfter(attendanceListCloseTime) : false;
  const isCheckWindow =
    checkWindowOpen !== null &&
    checkWindowClose !== null &&
    !now.isBefore(checkWindowOpen) &&
    !now.isAfter(checkWindowClose);
  const canShowRecordAndRating = recordVisibleTime !== null && !now.isBefore(recordVisibleTime);
  const shouldLoadAttendanceData =
    Boolean(matchClubId && clubId) && (showAttendanceList || isCheckWindow);
  const canSubmitAttendance =
    Boolean(matchClubId && clubId) && (canVoteAttendance || isCheckWindow);
  const attendanceQuery = useAttendanceQuery(matchClubId, {
    clubId: clubId ?? "",
    enabled: shouldLoadAttendanceData,
  });
  const attendanceMutation = useAttendanceMutation(matchClubId, {
    clubId: clubId ?? "",
    onError: (error) => {
      toast(getToastForError(error));
    },
  });
  const attendanceData =
    attendanceQuery.data && "matchClub" in attendanceQuery.data ? attendanceQuery.data : null;
  const attendanceMatchClub = attendanceData?.matchClub ?? null;
  const shouldLoadPostMatchData = canShowRecordAndRating && Boolean(matchClubId);
  const { data: ratingData, isLoading: isRatingLoading } = useRatingQuery(matchClubId, {
    enabled: shouldLoadPostMatchData,
  });
  const { data: recordData, isLoading: isRecordLoading } = useRecordQuery(matchClubId, {
    enabled: shouldLoadPostMatchData,
  });
  const currentStatus = attendanceData?.currentStatus ?? null;
  const currentChecked = attendanceData?.currentChecked ?? null;
  const ratingHighlights = useMemo(() => {
    if (!ratingData) return [];
    return ratingData.attendances
      .filter((attendance) => attendance.isVote)
      .map((attendance) => {
        const name = getAttendanceDisplayName(attendance) || "이름 미등록";
        const imageUrl =
          attendance.player?.user?.userImage?.url ??
          attendance.mercenary?.user?.userImage?.url ??
          null;
        const scoreAverage =
          attendance.evaluations.length > 0
            ? attendance.evaluations.reduce((sum, eva) => sum + (eva.score ?? 0), 0) /
              attendance.evaluations.length
            : null;
        const likeCount = attendance.evaluations.filter((eva) => eva.liked).length;
        return {
          id: attendance.id,
          name,
          imageUrl,
          scoreAverage,
          likeCount,
        };
      });
  }, [ratingData]);
  const attendanceList = useMemo(() => {
    if (!attendanceMatchClub) return [];
    return attendanceMatchClub.attendances
      .filter((attendance) => attendance.isVote)
      .map((attendance) => {
        const name = getAttendanceDisplayName(attendance) || "이름 미등록";
        const sortTime =
          attendance.checkTime ??
          attendance.voteTime ??
          attendance.createdAt ??
          attendance.updatedAt ??
          null;
        const sortValue = sortTime ? dayjs(sortTime).valueOf() : Number.POSITIVE_INFINITY;
        const statusRank = attendance.isCheck ? 0 : 1;
        return { id: attendance.id, name, isChecked: attendance.isCheck, sortValue, statusRank };
      })
      .sort((a, b) => {
        if (a.statusRank !== b.statusRank) return a.statusRank - b.statusRank;
        return a.sortValue - b.sortValue;
      });
  }, [attendanceMatchClub]);
  const momHighlights = useMemo(() => {
    if (!canShowRecordAndRating) return [];
    const target = ratingHighlights.filter(
      (att) => typeof att.scoreAverage === "number" && att.scoreAverage !== null,
    );
    const limit = Math.max(0, Math.ceil(ratingHighlights.length / 2));
    return target.sort((a, b) => (b.scoreAverage ?? 0) - (a.scoreAverage ?? 0)).slice(0, limit);
  }, [ratingHighlights, canShowRecordAndRating]);
  const likeHighlights = useMemo(() => {
    if (!canShowRecordAndRating) return [];
    return ratingHighlights
      .filter((att) => (att.likeCount ?? 0) > 0)
      .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
  }, [ratingHighlights, canShowRecordAndRating]);
  const goalHighlights = useMemo(() => {
    if (!canShowRecordAndRating || !recordData) return [];
    const stats = new Map<
      string,
      { id: string; name: string; imageUrl?: string | null; goalCount: number }
    >();
    for (const quarter of recordData.quarters ?? []) {
      for (const goal of quarter.records ?? []) {
        if (goal.isOwnGoal) continue;
        const attendance = goal.attendance;
        const name = getAttendanceDisplayName(attendance);
        if (!name) continue;
        const id = attendance.id;
        const imageUrl =
          attendance.player?.user?.userImage?.url ??
          attendance.mercenary?.user?.userImage?.url ??
          null;
        const current = stats.get(id);
        if (current) {
          current.goalCount += 1;
        } else {
          stats.set(id, { id, name, imageUrl, goalCount: 1 });
        }
      }
    }
    return Array.from(stats.values()).sort((a, b) => b.goalCount - a.goalCount);
  }, [recordData, canShowRecordAndRating]);

  const preMatchSummary = useMemo(() => {
    const source = attendanceMatchClub as {
      attendances?: PreMatchAttendance[];
      club?: { players?: PreMatchPlayer[] };
    } | null;
    if (!source) {
      return {
        attend: [] as AttendanceSummaryItem[],
        absent: [] as AttendanceSummaryItem[],
        pending: [] as PendingSummaryItem[],
      };
    }
    const attendances = source.attendances ?? [];
    const players = source.club?.players ?? [];

    const attend = attendances
      .filter((attendance) => attendance.isVote)
      .map((attendance) => {
        const name = getAttendanceDisplayName(attendance);
        if (!name) return null;
        return {
          id: attendance.id,
          name,
          type: attendance.player ? "PLAYER" : "MERCENARY",
        } as AttendanceSummaryItem;
      })
      .filter((item): item is AttendanceSummaryItem => item !== null);

    const absent = attendances
      .filter((attendance) => attendance.player && !attendance.isVote)
      .map((attendance) => {
        const name = getAttendanceDisplayName(attendance);
        if (!name) return null;
        return {
          id: attendance.id,
          name,
          type: "PLAYER",
        } as AttendanceSummaryItem;
      })
      .filter((item): item is AttendanceSummaryItem => item !== null);

    const pending = players
      .filter(
        (player) =>
          player.userId &&
          !attendances.some(
            (attendance) =>
              attendance.player?.userId === player.userId || attendance.playerId === player.id,
          ),
      )
      .map((player) => {
        const name = getPendingPlayerName(player) || "이름 미등록";
        return { id: player.id, name } satisfies PendingSummaryItem;
      });

    return { attend, absent, pending };
  }, [attendanceMatchClub]);

  if (isMatchClubLoading || !matchClub || !match) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  const baseMatchHref = clubId && matchClubId ? `/clubs/${clubId}/matches/${matchClubId}` : "";
  const attendancePageHref = baseMatchHref ? `${baseMatchHref}/attendance` : "";
  const handleAttendanceVote = async (isVote: boolean) => {
    if (!canSubmitAttendance || !canVoteAttendance) return;
    await attendanceMutation.mutateAsync({ isVote, isCheck: false });
  };

  const handleCheckIn = async () => {
    if (!isCheckWindow || !canSubmitAttendance) return;
    await attendanceMutation.mutateAsync({ isVote: true, isCheck: true });
  };

  return (
    <div className="space-y-6">
      {match?.description ? (
        <p className="text-sm text-muted-foreground whitespace-pre-line">{match.description}</p>
      ) : null}
      <Separator orientation="horizontal" className="h-[1px]" />
      {showAttendanceList ? (
        <PreMatchSection
          summary={preMatchSummary}
          attendancePageHref={attendancePageHref}
          canVoteAttendance={canVoteAttendance}
          attendanceIsLoading={attendanceQuery.isLoading}
          hasAttendanceData={Boolean(attendanceData)}
          currentStatus={currentStatus}
          attendanceMutationPending={attendanceMutation.isPending}
          onAttendanceVote={handleAttendanceVote}
        />
      ) : null}

      {isCheckWindow ? (
        <CheckInSection
          attendanceIsLoading={attendanceQuery.isLoading}
          hasAttendanceData={Boolean(attendanceData)}
          currentStatus={currentStatus}
          currentChecked={currentChecked}
          attendanceMutationPending={attendanceMutation.isPending}
          onCheckIn={handleCheckIn}
          attendanceList={attendanceList.map(({ sortValue, statusRank, ...rest }) => rest)}
        />
      ) : null}

      {canShowRecordAndRating &&
        (isRatingLoading || isRecordLoading ? (
          <div className="py-6 flex justify-center">
            <Loading />
          </div>
        ) : (
          <PostMatchSection moms={momHighlights} likes={likeHighlights} goals={goalHighlights} />
        ))}
    </div>
  );
};

export default MatchClubIdPage;
