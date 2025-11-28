import { useNavigate, useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";

import { Loading } from "~/components/Loading";
import {
  type AttendanceSummaryItem,
  type PendingSummaryItem,
  PreMatchSection,
} from "~/features/matches/client";
import type { AttendanceStatus } from "~/features/matches/isomorphic";
import {
  getAttendanceDisplayName,
  getPlayerDisplayName,
  useAttendanceMutation,
  useAttendanceQuery,
} from "~/features/matches/isomorphic";
import { useToast } from "~/hooks";
import { getToastForError } from "~/libs/isomorphic/errors";

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
  const _currentChecked = resolvedData?.currentChecked ?? "PENDING";
  const matchDate = matchClub ? new Date(matchClub.match.stDate) : null;
  const now = new Date();
  const isBeforeDay = matchDate ? now < dayjs(matchDate).subtract(1, "day").toDate() : false;
  const _isCheckTimeOpen = matchDate ? now > dayjs(matchDate).subtract(2, "hour").toDate() : false;
  const summary = useMemo(() => {
    if (!matchClub) {
      return {
        attend: [] as AttendanceSummaryItem[],
        absent: [] as AttendanceSummaryItem[],
        pending: [] as AttendanceSummaryItem[],
      };
    }
    const attendances = matchClub.attendances ?? [];
    const players = matchClub.club.players ?? [];

    const attendSummary = attendances
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
      .filter((item): item is AttendanceSummaryItem => Boolean(item));

    const absentSummary = attendances
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
      .filter((item): item is AttendanceSummaryItem => Boolean(item));

    const pendingSummary = players
      .filter(
        (player) =>
          player.userId && !attendances.some((attendance) => attendance.playerId === player.id),
      )
      .map((player) => {
        const name = getPlayerDisplayName(player) || "이름 미등록";
        return { id: player.id, name, type: "PLAYER" } as PendingSummaryItem;
      });

    return {
      attend: attendSummary,
      absent: absentSummary,
      pending: pendingSummary,
    };
  }, [matchClub]);

  if (attendanceQuery.isLoading || !resolvedData || !matchClub || !matchClubId || !clubId) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  const handleAttendanceChange = async (input: { isVote: boolean; isCheck: boolean }) => {
    try {
      await attendanceMutation.mutateAsync({ ...input });
    } catch (error) {
      toast(getToastForError(error));
    }
  };
  const handleAttendanceVote = async (isVote: boolean) => {
    await handleAttendanceChange({ isVote, isCheck: false });
  };

  return (
    <div className="space-y-4">
      <PreMatchSection
        summary={summary}
        canVoteAttendance={isBeforeDay}
        attendanceIsLoading={attendanceQuery.isLoading}
        hasAttendanceData={Boolean(resolvedData)}
        currentStatus={currentStatus as AttendanceStatus}
        attendanceMutationPending={attendanceMutation.isPending}
        onAttendanceVote={handleAttendanceVote}
      />
    </div>
  );
};

export default AttendancePage;
