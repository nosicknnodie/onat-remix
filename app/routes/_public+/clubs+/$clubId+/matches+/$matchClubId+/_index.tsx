import { useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Loading } from "~/components/Loading";
import { View } from "~/components/lexical/View";
import { Separator } from "~/components/ui/separator";
import {
  type AttendanceSummaryItem,
  CheckInSection,
  type PendingSummaryItem,
  PreMatchSection,
  RatingStatsCard,
  RatingStatsListItem,
} from "~/features/matches/client";
import {
  getAttendanceDisplayName,
  getPlayerDisplayName,
  parseMatchDescription,
  useAttendanceMutation,
  useAttendanceQuery,
  useMatchClubQuery,
  useRatingStatsQuery,
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
    user?: {
      name?: string | null;
      nick?: string | null;
      userImage?: { url?: string | null } | null;
    } | null;
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

const getPendingPlayerName = (player: PreMatchPlayer) => getPlayerDisplayName(player);

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
    Boolean(matchClubId && clubId) &&
    (showAttendanceList || isCheckWindow || canShowRecordAndRating);
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
  const { data: ratingStatsData, isLoading: isRatingStatsLoading } = useRatingStatsQuery(
    matchClubId,
    { enabled: shouldLoadPostMatchData },
  );
  const currentStatus = attendanceData?.currentStatus ?? null;
  const currentChecked = attendanceData?.currentChecked ?? null;
  const ratingStats = useMemo(() => {
    if (!ratingStatsData) return [];
    const filtered = ratingStatsData.stats
      .filter((stat) => (stat.averageRating ?? 0) > 0)
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    const voteCountFromAttendance =
      attendanceMatchClub?.attendances?.filter((a) => a.isVote).length ?? null;
    const voteCount = voteCountFromAttendance ?? ratingStatsData.stats.length ?? 0;
    const limit = voteCount > 0 ? Math.ceil(voteCount / 2) : filtered.length;
    return filtered.slice(0, Math.min(filtered.length, limit));
  }, [attendanceMatchClub, ratingStatsData]);
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
        <View
          editorState={parseMatchDescription(match.description)}
          className="text-sm text-muted-foreground"
        />
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

      {/* {canShowRecordAndRating && ( */}
      <div className="space-y-4">
        {isRatingStatsLoading ? (
          <div className="py-6 flex justify-center">
            <Loading />
          </div>
        ) : ratingStats.length === 0 ? (
          <div className="text-sm text-muted-foreground">평점 정보가 없습니다.</div>
        ) : (
          <>
            <div className="grid @sm:grid-cols-3 @max-sm:grid-cols-1 @md:max-lg:grid-cols-2 w-full gap-2">
              <div className="h-72 w-full @md:max-lg:col-span-3">
                <RatingStatsCard stats={ratingStats.at(0)} rank={1} />
              </div>
              <div className="h-72 w-full">
                <RatingStatsCard stats={ratingStats.at(1)} rank={2} />
              </div>
              <div className="h-72 w-full">
                <RatingStatsCard stats={ratingStats.at(2)} rank={3} />
              </div>
            </div>
            <div className="space-y-1">
              {ratingStats
                .filter((_, index) => index >= 3)
                .map((stat, index) => (
                  <RatingStatsListItem
                    key={stat.attendanceId}
                    stats={stat}
                    rank={index + 4}
                    matchStartDate={new Date(match.stDate)}
                  />
                ))}
            </div>
          </>
        )}
      </div>
      {/* )} */}
    </div>
  );
};

export default MatchClubIdPage;
