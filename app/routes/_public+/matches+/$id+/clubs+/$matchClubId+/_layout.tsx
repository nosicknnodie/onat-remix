import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  Outlet,
  useLoaderData,
  useOutletContext,
  useParams,
  useRevalidator,
} from "@remix-run/react";
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
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";
import { IMatchesIdLayoutPageLoaderReturnType } from "../../_layout";

export const handle = {
  breadcrumb: (match: any) => {
    const data = match.data;
    const params = match.params;
    const matchClubId = params.matchClubId;
    const matchClub = data.matchClub;
    const { revalidate } = useRevalidator();
    const [, startTransition] = useTransition();
    const handleMatchClubIsSelfChange = (isSelf: boolean) => {
      startTransition(async () => {
        await fetch("/api/matchClubs/" + matchClubId + "/isSelf", {
          method: "POST",
          body: JSON.stringify({
            isSelf: isSelf,
          }),
        });
        revalidate();
      });
    };
    return (
      <>
        {data.matchClub?.club?.name}
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
                onClick={() => handleMatchClubIsSelfChange(!matchClub?.isSelf)}
              >
                자체전 여부
              </DropdownMenuCheckboxItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  },
};

interface IMatchClubIdLayoutProps {}
export type IMatchClubIdLayoutOutletContext =
  IMatchesIdLayoutPageLoaderReturnType & Awaited<ReturnType<typeof loader>>;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
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
  return { matchClub };
};

const MatchClubIdLayout = (_props: IMatchClubIdLayoutProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const matchClub = loaderData.matchClub;
  const outletData = useOutletContext<IMatchesIdLayoutPageLoaderReturnType>();
  return (
    <>
      <div className="flex gap-x-4 p-2">
        <ItemLink to={`/matches/${params.id}/clubs/${params.matchClubId}`} end>
          정보
        </ItemLink>
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
        <ItemLink
          to={`/matches/${params.id}/clubs/${params.matchClubId}/record`}
        >
          기록
        </ItemLink>
        <ItemLink
          to={`/matches/${params.id}/clubs/${params.matchClubId}/rating`}
        >
          평점등록
        </ItemLink>
      </div>
      <Outlet context={{ ...outletData, ...loaderData }} />
    </>
  );
};

export default MatchClubIdLayout;
