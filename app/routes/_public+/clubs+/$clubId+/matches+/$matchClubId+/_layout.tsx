/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import { Link, Outlet, useLocation, useParams } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect } from "react";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { useSession } from "~/contexts";
import { useMembershipInfoQuery, usePlayerPermissionsQuery } from "~/features/clubs/isomorphic";
import {
  CheckManageDrawer,
  type ClubSubnavItem,
  ClubSubnavTabs,
  CommentSection,
  MatchHeaderCard,
  MercenaryManageDrawer,
  PlayerManageDrawer,
} from "~/features/matches/client";
import {
  positionQueryKeys,
  ratingQueryKeys,
  recordQueryKeys,
  teamQueryKeys,
  useAttendanceQuery,
  useMatchClubQuery,
  useMatchCommentsQuery,
  useToggleAttendanceStateMutation,
  useToggleMercenaryAttendanceMutation,
  useTogglePlayerAttendanceMutation,
} from "~/features/matches/isomorphic";
import { useToast } from "~/hooks";
import { getJson } from "~/libs/api-client";
import { getToastForError } from "~/libs/errors";

interface IMatchClubIdLayoutProps {}

const MatchClubIdLayout = (_props: IMatchClubIdLayoutProps) => {
  const params = useParams();
  const session = useSession();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const matchClubId = params.matchClubId;
  const clubId = params.clubId;
  const { data: matchClubQueryData, isLoading: isMatchClubLoading } = useMatchClubQuery(
    matchClubId,
    {
      clubId,
      enabled: Boolean(matchClubId),
    },
  );
  const { data: membership } = useMembershipInfoQuery(clubId ?? "", {
    enabled: Boolean(clubId),
  });
  const { data: permissions = [] } = usePlayerPermissionsQuery(membership?.id ?? "", {
    enabled: Boolean(membership?.id),
  });
  const { data: commentsData } = useMatchCommentsQuery(matchClubId, {
    enabled: Boolean(matchClubId),
  });
  const isAttendancePage = location.pathname.startsWith(
    `/clubs/${params.clubId}/matches/${params.matchClubId}/attendance`,
  );
  const isInfoPage = location.pathname === `/clubs/${params.clubId}/matches/${params.matchClubId}`;
  const attendanceQuery = useAttendanceQuery(matchClubId, {
    clubId: clubId ?? "",
    enabled: Boolean(matchClubId && clubId && isAttendancePage),
  });
  const toggleAttendanceStateMutation = useToggleAttendanceStateMutation(matchClubId);
  const togglePlayerAttendance = useTogglePlayerAttendanceMutation(matchClubId);
  const toggleMercenaryAttendance = useToggleMercenaryAttendanceMutation(matchClubId);

  useEffect(() => {
    if (!matchClubId) return;
    const prefetchQueries = async () => {
      const tasks: Array<Promise<unknown>> = [];
      tasks.push(
        queryClient
          .prefetchQuery({
            queryKey: positionQueryKeys.detail(matchClubId),
            queryFn: async () => getJson(`/api/attendances?matchClubId=${matchClubId}`),
          })
          .catch(() => undefined),
      );
      tasks.push(
        queryClient
          .prefetchQuery({
            queryKey: positionQueryKeys.quarters(matchClubId),
            queryFn: async () => getJson(`/api/matchClubs/${matchClubId}/position/quarters`),
          })
          .catch(() => undefined),
      );
      tasks.push(
        queryClient
          .prefetchQuery({
            queryKey: positionQueryKeys.settingAttendances(matchClubId),
            queryFn: async () => getJson(`/api/matchClubs/${matchClubId}/position/attendances`),
          })
          .catch(() => undefined),
      );
      tasks.push(
        queryClient
          .prefetchQuery({
            queryKey: positionQueryKeys.settingMatchClub(matchClubId),
            queryFn: async () => getJson(`/api/matchClubs/${matchClubId}/position/setting`),
          })
          .catch(() => undefined),
      );
      tasks.push(
        queryClient
          .prefetchQuery({
            queryKey: recordQueryKeys.detail(matchClubId),
            queryFn: async () => getJson(`/api/matchClubs/${matchClubId}/record`),
          })
          .catch(() => undefined),
      );
      tasks.push(
        queryClient
          .prefetchQuery({
            queryKey: ratingQueryKeys.detail(matchClubId),
            queryFn: async () => getJson(`/api/matchClubs/${matchClubId}/rating`),
          })
          .catch(() => undefined),
      );
      if (clubId) {
        const searchParams = new URLSearchParams({ clubId });
        tasks.push(
          queryClient
            .prefetchQuery({
              queryKey: teamQueryKeys.detail(matchClubId),
              queryFn: async () =>
                getJson(`/api/matchClubs/${matchClubId}/teams?${searchParams.toString()}`),
            })
            .catch(() => undefined),
        );
      }
      await Promise.all(tasks);
    };
    void prefetchQueries();
  }, [matchClubId, clubId, queryClient]);

  const matchSummary = matchClubQueryData?.matchSummary ?? null;
  const matchClub = matchClubQueryData?.matchClub;
  const isLoading = isMatchClubLoading || !matchClub || !matchSummary;
  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }
  const role = {
    isPlayer: Boolean(membership),
    isAdmin: Boolean(membership && (membership.role === "MANAGER" || membership.role === "MASTER")),
    isMercenary: Boolean(
      session?.id &&
        matchClub.attendances?.some((attendance) => attendance.mercenary?.userId === session.id),
    ),
  } as const;
  const match = matchSummary.match;
  const base = `/clubs/${params.clubId}/matches/${params.matchClubId}`;
  const hasMatchMaster = permissions.includes("MATCH_MASTER");
  const hasMatchManage = permissions.includes("MATCH_MANAGE");
  const manageWindowActive = dayjs().diff(dayjs(match.stDate).add(1, "day"), "millisecond") <= 0;
  const canManageActions = hasMatchMaster || (hasMatchManage && manageWindowActive);
  const attendanceData =
    attendanceQuery.data && "matchClub" in attendanceQuery.data ? attendanceQuery.data : null;
  const matchClubAttendances = attendanceData?.matchClub.attendances ?? [];
  const attendancePlayers = matchClubAttendances
    .filter((att) => att.playerId && att.isVote)
    .map((att) => att.playerId!);
  const attendanceMercenaries = matchClubAttendances
    .filter((att) => att.mercenaryId && att.isVote)
    .map((att) => att.mercenaryId!);

  const managePlayers =
    attendanceData?.matchClub.club.players.map((p) => ({
      id: p.id,
      user: p.user,
      isAttended: attendancePlayers.includes(p.id),
    })) ?? [];
  const manageMercenaries =
    attendanceData?.matchClub.club.mercenarys.map((m) => ({
      id: m.id,
      name: m.name,
      hp: m.hp,
      user: m.user,
      isAttended: attendanceMercenaries.includes(m.id),
    })) ?? [];
  const manageAttendances = matchClubAttendances
    .filter((att) => att.isVote)
    .map((a) => ({
      id: a.id,
      name: a.player?.user?.name || a.mercenary?.user?.name || a.mercenary?.name || "",
      imageUrl: a.player?.user?.userImage?.url || a.mercenary?.user?.userImage?.url || undefined,
      isCheck: a.isCheck,
    }));
  const items: ClubSubnavItem[] = [
    { label: "정보", href: base, active: location.pathname === base },
  ];
  if (role.isPlayer || role.isMercenary) {
    items.push({
      label: "참석",
      href: `${base}/attendance`,
      active: location.pathname.startsWith(`${base}/attendance`),
    });
    if (matchClub?.isSelf) {
      items.push({
        label: "팀",
        href: `${base}/team`,
        active: location.pathname.startsWith(`${base}/team`),
      });
    }
    items.push({
      label: "포지션",
      href: `${base}/position`,
      active: location.pathname.startsWith(`${base}/position`),
    });
  }
  if (role.isPlayer) {
    items.push({
      label: "기록",
      href: `${base}/record`,
      active: location.pathname.startsWith(`${base}/record`),
    });
    items.push({
      label: "평점",
      href: `${base}/rating`,
      active: location.pathname.startsWith(`${base}/rating`),
    });
  }

  return (
    <>
      <MatchHeaderCard
        title={match.title}
        placeName={match.placeName}
        address={match.address}
        stDate={match.stDate}
        createUser={match.createUser}
        createdAt={match.createdAt}
        headerTabs={<ClubSubnavTabs items={items} className="px-0" />}
        footerActions={
          <div className="flex flex-wrap gap-2 justify-end">
            {canManageActions && isInfoPage && (
              <>
                <Button size="sm" variant="outline" asChild disabled={!matchClub?.matchId}>
                  <Link
                    to={
                      clubId
                        ? `/clubs/${matchClub.clubId}/matches/${matchClub.id}/edit`
                        : `/matches/${matchClub.matchId}/edit`
                    }
                  >
                    매치 수정
                  </Link>
                </Button>
              </>
            )}
            {canManageActions &&
              isAttendancePage &&
              attendanceQuery.data &&
              !("redirectTo" in attendanceQuery.data) &&
              attendanceQuery.data.matchClub && (
                <>
                  <CheckManageDrawer
                    attendances={manageAttendances}
                    onToggle={async (attendanceId, isCheck) => {
                      try {
                        await toggleAttendanceStateMutation.mutateAsync({
                          id: attendanceId,
                          isCheck,
                        });
                        await attendanceQuery.refetch();
                        return true;
                      } catch (e) {
                        toast(getToastForError(e));
                        return false;
                      }
                    }}
                  >
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      출석 관리
                    </Button>
                  </CheckManageDrawer>
                  <PlayerManageDrawer
                    players={managePlayers}
                    onToggle={async (playerId, isVote) => {
                      try {
                        await togglePlayerAttendance.mutateAsync({
                          matchClubId: matchClubId ?? "",
                          playerId,
                          isVote,
                        });
                        await attendanceQuery.refetch();
                        return true;
                      } catch (e) {
                        toast(getToastForError(e));
                        return false;
                      }
                    }}
                  >
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      참석 관리
                    </Button>
                  </PlayerManageDrawer>
                  <MercenaryManageDrawer
                    mercenaries={manageMercenaries}
                    onToggle={async (mercenaryId, isVote) => {
                      try {
                        await toggleMercenaryAttendance.mutateAsync({
                          matchClubId: matchClubId ?? "",
                          mercenaryId,
                          isVote,
                        });
                        await attendanceQuery.refetch();
                        return true;
                      } catch (e) {
                        toast(getToastForError(e));
                        return false;
                      }
                    }}
                  >
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      용병 추가
                    </Button>
                  </MercenaryManageDrawer>
                  <Button size="sm" asChild variant="outline">
                    <Link to={`/clubs/${params.clubId}/mercenaries`}>용병 관리</Link>
                  </Button>
                </>
              )}
          </div>
        }
        commentCount={commentsData?.comments.length ?? 0}
      >
        <Outlet />
      </MatchHeaderCard>
      <CommentSection matchClubId={params.matchClubId} />
    </>
  );
};

export default MatchClubIdLayout;
