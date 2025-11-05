import { useOutletContext } from "@remix-run/react";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Separator } from "~/components/ui/separator";
import {
  type AttendanceSummaryItem,
  MatchSummarySection,
  type PendingSummaryItem,
  PreMatchAttendanceSummary,
} from "~/features/matches";
import type { MatchClubLayoutLoaderData } from "./_layout";

interface IMatchClubIdPageProps {}

type MatchClubAttendance = NonNullable<
  MatchClubLayoutLoaderData["matchClub"]
>["attendances"][number];
type MatchClubPlayer = NonNullable<
  MatchClubLayoutLoaderData["matchClub"]
>["club"]["players"][number];

const getAttendanceDisplayName = (attendance: MatchClubAttendance) =>
  attendance.player?.user?.name ??
  attendance.player?.nick ??
  attendance.mercenary?.user?.name ??
  attendance.mercenary?.name ??
  "";

const getPendingPlayerName = (player: MatchClubPlayer) => player.user?.name ?? player.nick ?? "";

const MatchClubIdPage = (_props: IMatchClubIdPageProps) => {
  const data = useOutletContext<MatchClubLayoutLoaderData>();
  const match = data.matchSummary.match;
  const hasStarted = !dayjs(match.stDate).isAfter(dayjs());

  const preMatchSummary = useMemo(() => {
    const matchClub = data.matchClub;
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
  }, [data.matchClub]);

  return (
    <div className="space-y-6">
      {data.matchSummary.match.description ? (
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {data.matchSummary.match.description}
        </p>
      ) : null}
      <Separator orientation="horizontal" className="h-[1px]" />
      {hasStarted ? (
        <MatchSummarySection summaries={data.matchSummary.summaries} highlight={data.summary} />
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
