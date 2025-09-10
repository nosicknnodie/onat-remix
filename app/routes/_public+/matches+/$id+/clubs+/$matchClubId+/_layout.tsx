/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useRevalidator,
} from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { confirm } from "~/components/ui/confirm";
import { ClubAdminMenu, type ClubSubnavItem, ClubSubnavTabs } from "~/features/matches";
import { club as matches } from "~/features/matches/index.server";
import CommentSection from "~/features/matches/ui/match-comment/CommentSection";
import { getUser } from "~/libs/index.server";
import type { IMatchesIdLayoutPageLoaderReturnType } from "../../_layout";

const RightActions = ({ match }: { match: any }) => {
  const data = match.data;
  const params = match.params;
  const role = data.role;
  const matchClubId = params.matchClubId;
  const matchClub = data.matchClub;
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const handleMatchClubIsSelfChange = (isSelf: boolean) => {
    startTransition(async () => {
      await fetch(`/api/matchClubs/${matchClubId}/isSelf`, {
        method: "POST",
        body: JSON.stringify({
          isSelf: isSelf,
        }),
      });
      queryClient.invalidateQueries();
      revalidate();
      navigate(`/matches/${params.id}/clubs/${matchClubId}`);
    });
  };
  if (!role.isAdmin) return null;
  return (
    <ClubAdminMenu
      isAdmin={role.isAdmin}
      editHref={`/matches/${params.id}/edit`}
      isSelf={matchClub?.isSelf}
      onToggleSelf={() => {
        confirm({
          title: "매칭 타입변경 주의",
          description: "타입 변경시 포지션 및 골기록이 초기화됩니다. 타입을 변경하시겠습니까?",
          confirmText: "타입 변경",
          cancelText: "취소",
        }).onConfirm(() => handleMatchClubIsSelfChange(!matchClub?.isSelf));
      }}
    />
  );
};

export const handle = {
  breadcrumb: (match: any) => match.data.matchClub?.club?.name,
  right: (match: any) => <RightActions match={match} />,
};

interface IMatchClubIdLayoutProps {}
export type IMatchClubIdLayoutOutletContext = IMatchesIdLayoutPageLoaderReturnType &
  Awaited<ReturnType<typeof loader>>;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const data = await matches.service.getMatchClubLayoutData(user?.id, params.matchClubId!);
  return data;
};

const MatchClubIdLayout = (_props: IMatchClubIdLayoutProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const location = useLocation();
  const role = loaderData.role;
  const matchClub = loaderData.matchClub;
  const outletData = useOutletContext<IMatchesIdLayoutPageLoaderReturnType>();
  const base = `/matches/${params.id}/clubs/${params.matchClubId}`;
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
  return (
    <>
      <ClubSubnavTabs items={items} />
      <Outlet context={{ ...outletData, ...loaderData }} />
      <CommentSection matchClubId={params.matchClubId} />
    </>
  );
};

export default MatchClubIdLayout;
