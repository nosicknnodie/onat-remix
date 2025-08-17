/* eslint-disable @typescript-eslint/no-explicit-any */
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  Outlet,
  useLoaderData,
  useNavigate,
  useOutletContext,
  useParams,
  useRevalidator,
} from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import ItemLink from "~/components/ItemLink";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { confirm } from "~/libs/confirm";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";
import CommentSection from "~/template/match-comment/CommentSection";
import { IMatchesIdLayoutPageLoaderReturnType } from "../../_layout";

const Breadcrumb = ({ match }: { match: any }) => {
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
      await fetch("/api/matchClubs/" + matchClubId + "/isSelf", {
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0"
            )}
          >
            <span className="sr-only">Open menu</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/matches/${params.id}/edit`}>매치 수정</Link>
          </DropdownMenuItem>
          {matchClubId && (
            <DropdownMenuCheckboxItem
              checked={matchClub?.isSelf}
              onClick={() =>
                confirm({
                  title: "매칭 타입변경 주의",
                  description:
                    "타입 변경시 포지션 및 골기록이 초기화됩니다. 타입을 변경하시겠습니까?",
                  confirmText: "타입 변경",
                  cancelText: "취소",
                }).onConfirm(() =>
                  handleMatchClubIsSelfChange(!matchClub?.isSelf)
                )
              }
            >
              자체전 여부
            </DropdownMenuCheckboxItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export const handle = {
  breadcrumb: (match: any) => match.data.matchClub?.club?.name,
  right: (match: any) => <Breadcrumb match={match} />,
};

interface IMatchClubIdLayoutProps {}
export type IMatchClubIdLayoutOutletContext =
  IMatchesIdLayoutPageLoaderReturnType & Awaited<ReturnType<typeof loader>>;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const matchClub = await prisma.matchClub.findUnique({
    where: {
      id: params.matchClubId,
    },
    include: {
      club: { include: { image: true, emblem: true } },
      quarters: { include: { team1: true, team2: true } },
      teams: true,
      attendances: {
        where: {
          isVote: true,
        },
        include: {
          assigneds: true,
          player: { include: { user: { include: { userImage: true } } } },
          mercenary: { include: { user: { include: { userImage: true } } } },
        },
      },
    },
  });
  const player = user
    ? await prisma.player.findFirst({
        where: {
          userId: user.id,
          clubId: matchClub?.clubId || "",
          status: "APPROVED",
        },
      })
    : null;
  const mercenary = user
    ? matchClub?.attendances.find((a) => a.mercenary?.userId === user.id)
    : null;
  const isPlayer = !!player;
  const isMercenary = !!mercenary;
  const isAdmin =
    !!player && (player.role === "MANAGER" || player.role === "MASTER");
  const role = {
    isPlayer,
    isAdmin,
    isMercenary,
  };
  return { matchClub, role };
};

const MatchClubIdLayout = (_props: IMatchClubIdLayoutProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const role = loaderData.role;
  const matchClub = loaderData.matchClub;
  const outletData = useOutletContext<IMatchesIdLayoutPageLoaderReturnType>();
  return (
    <>
      <div className="flex gap-x-4 p-2">
        <ItemLink to={`/matches/${params.id}/clubs/${params.matchClubId}`} end>
          정보
        </ItemLink>
        {(role.isPlayer || role.isMercenary) && (
          <>
            <ItemLink
              to={`/matches/${params.id}/clubs/${params.matchClubId}/attendance`}
            >
              참석
            </ItemLink>
            {matchClub?.isSelf && (
              <ItemLink
                to={`/matches/${params.id}/clubs/${params.matchClubId}/team`}
              >
                Team
              </ItemLink>
            )}
            <ItemLink
              to={`/matches/${params.id}/clubs/${params.matchClubId}/position`}
            >
              포지션
            </ItemLink>
          </>
        )}
        {role.isPlayer && (
          <>
            <ItemLink
              to={`/matches/${params.id}/clubs/${params.matchClubId}/record`}
            >
              기록
            </ItemLink>
            <ItemLink
              to={`/matches/${params.id}/clubs/${params.matchClubId}/rating`}
            >
              평점
            </ItemLink>
          </>
        )}
      </div>
      <Outlet context={{ ...outletData, ...loaderData }} />
      <CommentSection matchClubId={params.matchClubId} />
    </>
  );
};

export default MatchClubIdLayout;
