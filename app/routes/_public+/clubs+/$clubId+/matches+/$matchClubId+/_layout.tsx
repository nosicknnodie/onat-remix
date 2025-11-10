/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
  useRevalidator,
} from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { confirm } from "~/components/ui/confirm";
import {
  ClubAdminMenu,
  type ClubSubnavItem,
  ClubSubnavTabs,
  CommentSection,
  MatchHeaderCard,
} from "~/features/matches/client";
import { clubService, detailService } from "~/features/matches/server";
import { getUser, prisma } from "~/libs/index.server";

export const handle = {
  breadcrumb: (match: any) => {
    return match.data.matchSummary.match.title || "매치";
  },
  // right: (match: any) => ,
};

interface IMatchClubIdLayoutProps {}
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const matchClubData = await clubService.getMatchClubLayoutData(user?.id, params.matchClubId!);
  const matchClub = matchClubData.matchClub;
  if (!matchClub) {
    throw redirect("/404");
  }
  const matchSummary = await detailService.getMatchDetail(matchClub.matchId);
  if (!matchSummary) {
    throw redirect("/404");
  }
  const commentCount = await prisma.comment.count({
    where: {
      targetId: params.matchClubId!,
      targetType: "MATCH_CLUB",
      isDeleted: false,
    },
  });
  return {
    ...matchClubData,
    matchSummary,
    commentCount,
  };
};

export type MatchClubLayoutLoaderData = Awaited<ReturnType<typeof loader>>;

const MatchClubIdLayout = (_props: IMatchClubIdLayoutProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const role = loaderData.role;
  const matchClub = loaderData.matchClub;
  const match = loaderData.matchSummary.match;
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
        label: "Team",
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
      queryClient.invalidateQueries();
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
        commentCount={loaderData.commentCount}
      >
        <Outlet context={loaderData} />
      </MatchHeaderCard>
      <CommentSection matchClubId={params.matchClubId} />
    </>
  );
};

export default MatchClubIdLayout;
