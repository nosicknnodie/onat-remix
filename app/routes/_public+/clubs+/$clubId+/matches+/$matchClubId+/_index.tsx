import { useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Loading } from "~/components/Loading";
import { Separator } from "~/components/ui/separator";
import {
  type AttendanceSummaryItem,
  MatchSummarySection,
  type PendingSummaryItem,
  PreMatchAttendanceSummary,
} from "~/features/matches/client";
import { type MatchClubQueryResponse, useMatchClubQuery } from "~/features/matches/isomorphic";

export const handle = {
  breadcrumb: () => {
    return <>정보</>;
  },
};

interface IMatchClubIdPageProps {}

type MatchClubAttendance = NonNullable<MatchClubQueryResponse["matchClub"]>["attendances"][number];
type MatchClubPlayer = NonNullable<MatchClubQueryResponse["matchClub"]>["club"]["players"][number];

const getAttendanceDisplayName = (attendance: MatchClubAttendance) =>
  attendance.player?.user?.name ??
  attendance.player?.nick ??
  attendance.mercenary?.user?.name ??
  attendance.mercenary?.name ??
  "";

const getPendingPlayerName = (player: MatchClubPlayer) => player.user?.name ?? player.nick ?? "";

const MatchClubIdPage = (_props: IMatchClubIdPageProps) => {
  const params = useParams();
  const matchClubId = params.matchClubId;
  const clubId = params.clubId;
  const { data: matchClubQueryData, isLoading: isMatchClubLoading } = useMatchClubQuery(
    matchClubId,
    {
      clubId,
      enabled: Boolean(matchClubId),
    },
  );
  const matchClub = matchClubQueryData?.matchClub ?? null;
  const matchSummary = matchClubQueryData?.matchSummary ?? null;
  const summaryHighlight = matchClubQueryData?.summary ?? null;

  const preMatchSummary = useMemo(() => {
    if (!matchClub) {
      return {
        attend: [] as AttendanceSummaryItem[],
        absent: [] as AttendanceSummaryItem[],
        pending: [] as PendingSummaryItem[],
      };
    }
    const attendances = matchClub.attendances ?? [];
    const players = matchClub.club?.players ?? [];

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
      .filter((attendance) => !attendance.isVote)
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

    const pending = players
      .filter(
        (player) =>
          player.userId &&
          !attendances.some((attendance) => attendance.player?.userId === player.userId),
      )
      .map((player) => {
        const name = getPendingPlayerName(player) || "이름 미등록";
        return { id: player.id, name } satisfies PendingSummaryItem;
      });

    return { attend, absent, pending };
  }, [matchClub]);

  if (isMatchClubLoading || !matchClub || !matchSummary) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  const match = matchSummary.match;
  const hasStarted = !dayjs(match.stDate).isAfter(dayjs());

  return (
    <div className="space-y-6">
      {matchSummary.match.description ? (
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {matchSummary.match.description}
        </p>
      ) : null}
      <Separator orientation="horizontal" className="h-[1px]" />
      {hasStarted ? (
        <MatchSummarySection summaries={matchSummary.summaries} highlight={summaryHighlight} />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            * 경기 시작 후에 경기 요약과 MOM 정보가 제공됩니다. 지금은 참석 현황을 확인하세요.
          </p>
          <PreMatchAttendanceSummary
            attend={preMatchSummary.attend}
            absent={preMatchSummary.absent}
            pending={preMatchSummary.pending}
          />
        </div>
      )}
    </div>
  );
};

export default MatchClubIdPage;
