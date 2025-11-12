/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import { Outlet, useLocation, useNavigate, useParams, useRevalidator } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { Loading } from "~/components/Loading";
import { confirm } from "~/components/ui/confirm";
import { useSession } from "~/contexts";
import { useMembershipInfoQuery } from "~/features/clubs/isomorphic";
import {
  ClubAdminMenu,
  type ClubSubnavItem,
  ClubSubnavTabs,
  CommentSection,
  MatchHeaderCard,
} from "~/features/matches/client";
import {
  matchClubQueryKeys,
  matchSummaryQueryKeys,
  useMatchClubQuery,
  useMatchCommentsQuery,
  useMatchSummaryQuery,
} from "~/features/matches/isomorphic";

interface IMatchClubIdLayoutProps {}

const MatchClubIdLayout = (_props: IMatchClubIdLayoutProps) => {
  const params = useParams();
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
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
  const { data: matchSummary, isLoading: isMatchSummaryLoading } = useMatchSummaryQuery(
    matchClubId,
    {
      enabled: Boolean(matchClubId),
    },
  );
  const { data: commentsData } = useMatchCommentsQuery(matchClubId, {
    enabled: Boolean(matchClubId),
  });
  const isLoading = isMatchClubLoading || isMatchSummaryLoading;
  const matchClub = matchClubQueryData?.matchClub;
  const summary = matchClubQueryData?.summary ?? null;
  if (isLoading || !matchClub || !matchSummary) {
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

  const handleMatchClubIsSelfChange = (isSelf: boolean) => {
    startTransition(async () => {
      await fetch(`/api/matchClubs/${params.matchClubId}/isSelf`, {
        method: "POST",
        body: JSON.stringify({ isSelf }),
      });
      await queryClient.invalidateQueries({
        queryKey: matchClubQueryKeys.detail(matchClubId ?? ""),
      });
      await queryClient.invalidateQueries({
        queryKey: matchSummaryQueryKeys.detail(matchClubId ?? ""),
      });
      revalidate();
      navigate(`/clubs/${params.clubId}/matches/${params.matchClubId}`);
    });
  };

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
          role.isAdmin ? (
            <ClubAdminMenu
              isAdmin={role.isAdmin}
              editHref={matchClub?.matchId ? `/matches/${matchClub.matchId}/edit` : "/"}
              isSelf={matchClub?.isSelf}
              onToggleSelf={() => {
                confirm({
                  title: "매칭 타입변경 주의",
                  description:
                    "타입 변경시 포지션 및 골기록이 초기화됩니다. 타입을 변경하시겠습니까?",
                  confirmText: "타입 변경",
                  cancelText: "취소",
                }).onConfirm(() => handleMatchClubIsSelfChange(!matchClub?.isSelf));
              }}
            />
          ) : null
        }
        commentCount={commentsData?.comments.length ?? 0}
      >
        <Outlet
          context={{
            matchClub,
            summary,
            matchSummary,
          }}
        />
      </MatchHeaderCard>
      <CommentSection matchClubId={params.matchClubId} />
    </>
  );
};

export default MatchClubIdLayout;
