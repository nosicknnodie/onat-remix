import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, Outlet, UIMatch, useLoaderData, useMatches, useParams } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";

import { Club, File, Player } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Fragment } from "react/jsx-runtime";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import ItemLink from "~/components/ItemLink";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/contexts/AuthUserContext";
import { getUser } from "~/libs/db/lucia.server";
import JoinDialog from "~/template/club/JoinDialog";

interface ILayoutProps {}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
  // const club = await prisma.club.findUnique({
  //   where: {
  //     id: params.id,
  //   },
  //   include: {
  //     image: { select: { url: true } },
  //     emblem: { select: { url: true } },
  //   },
  // });
  const [club, player] = await Promise.all([
    prisma.club.findUnique({
      where: {
        id: params.id,
      },
      include: {
        image: { select: { url: true } },
        emblem: { select: { url: true } },
      },
    }),
    user
      ? prisma.player.findFirst({
          where: {
            userId: user?.id,
            clubId: params.id,
          },
          include: {
            user: {
              include: {
                userImage: true,
              },
            },
          },
        })
      : null,
  ]);

  if (!club) {
    throw redirect("/404");
  }

  return Response.json({ club, player });
}

export type IClubLayoutLoaderData = {
  club: Club & {
    image?: File | null;
    emblem?: File | null;
  };
  player: (Player & { user: { userImage: string } }) | null;
};

const Layout = (_props: ILayoutProps) => {
  const data = useLoaderData<IClubLayoutLoaderData>();
  const user = useSession();
  const params = useParams();
  const matches = useMatches() as UIMatch<unknown, { breadcrumb?: React.ReactNode }>[];

  const breadcrumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      name: match.handle.breadcrumb,
      path: match.pathname.endsWith("/") ? match.pathname.slice(0, -1) : match.pathname,
    }));

  const isJoined = !!user && !data.player;
  // 재가입버튼
  const isReJoined =
    user &&
    data.player &&
    new Date(Date.now() - 1000 * 60 * 60) > new Date(data.player.updatedAt) &&
    (data.player.status === "LEFT" ||
      data.player.status === "BANNED" ||
      data.player.status === "REJECTED");
  // 승인 대기중
  // 가입 취소
  const isJoinPending = user && data.player && data.player.status === "PENDING";
  // 거절
  const isRejected = user && data.player && data.player.status === "REJECTED";
  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink to="/clubs">클럽</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink to={"/clubs/" + params.id}>{data.club.name}</BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((breadcrumb) => (
                <Fragment key={breadcrumb.path}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink to={breadcrumb.path}>{breadcrumb.name}</BreadcrumbLink>
                  </BreadcrumbItem>
                </Fragment>
              ))}
              <BreadcrumbItem>
                {(data.player?.role === "MANAGER" || data.player?.role === "MASTER") && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "h-8 w-8 p-0 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0",
                        )}
                      >
                        <span className="sr-only">Open menu</span>
                        <DotsHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/clubs/${params.id}/edit`}>클럽 수정</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={"/matches/new"}>매치 추가</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex gap-2 items-center">
            {/* 가입하기 버튼 */}
            {isJoined && (
              <JoinDialog>
                <Button>가입</Button>
              </JoinDialog>
            )}
            {isRejected && <FormError className="py-2">가입 승인 거절되었습니다.</FormError>}
            {isJoinPending && <FormSuccess>가입 승인 대기중입니다.</FormSuccess>}
            {isReJoined && (
              <JoinDialog player={data.player ?? undefined}>
                <Button>재가입</Button>
              </JoinDialog>
            )}
          </div>
        </div>
        <div className="flex gap-6 px-4 text-base w-full">
          <ItemLink to={`/clubs/${data.club.id}`} end>
            정보
          </ItemLink>
          <ItemLink to={`/clubs/${data.club.id}/members`}>멤버</ItemLink>
          <ItemLink to={`/clubs/${data.club.id}/matches`}>매치</ItemLink>
          <ItemLink to={`/clubs/${data.club.id}/pendings`}>승인대기</ItemLink>
        </div>
        <Outlet context={{ club: data.club, player: data.player }} />
      </div>
    </>
  );
};

export default Layout;
