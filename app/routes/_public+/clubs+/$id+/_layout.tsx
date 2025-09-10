/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import type { Board, Club, File, Player } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import ItemLink from "~/components/ItemLink";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/contexts";
import { service } from "~/features/clubs/index.server";
import JoinDialog from "~/features/clubs/ui/JoinDialog";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";

export const handle = {
  breadcrumb: (match: any) => {
    const data = match.data;
    const params = match.params;
    return (
      <>
        <BreadcrumbLink to={`/clubs/${params.id}`}>{data.club.name}</BreadcrumbLink>
      </>
    );
  },
  right: (match: any) => {
    const data = match.data;
    const params = match.params;
    return (
      <>
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
              <DropdownMenuItem asChild>
                <Link to={`/clubs/${params.id}/boards/new`}>게시글 추가</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </>
    );
  },
};

interface ILayoutProps {}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const { club, player } = await service.getClubLayoutData(params.id as string, user?.id);

  if (!club) {
    throw redirect("/404");
  }

  return { club, player };
}

export type IClubLayoutLoaderData = {
  club: Club & {
    image?: File | null;
    emblem?: File | null;
    boards?: Board[];
  };
  player: (Player & { user: { userImage: string } }) | null;
};

const Layout = (_props: ILayoutProps) => {
  const data = useLoaderData<IClubLayoutLoaderData>();
  const user = useSession();

  // 회원
  const isInJoined = !!data.player;
  // 관리자
  const isAdmin =
    !!data.player && (data.player.role === "MANAGER" || data.player.role === "MASTER");

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
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center">
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

          {/* <DropdownMenu>
            <DropdownMenuTrigger className="flex gap-1 items-center ring-0 outline-none">
              <div
                className={cn(
                  "text-foreground pb-1 relative incline-block font-semibold hover:text-primary ",
                  "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                  {
                    "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
                      location.pathname.startsWith(
                        `/clubs/${data.club.id}/boards`
                      ),
                  }
                )}
              >
                게시판
              </div>
              <ChevronDown
                className={cn("ml-1 w-4 h-4", {
                  "text-primary": location.pathname.startsWith(
                    `/clubs/${data.club.id}/boards`
                  ),
                })}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {boards?.map((board) => (
                <DropdownMenuItem key={board.id} asChild>
                  <Link
                    to={`/clubs/${data.club.id}/boards/${board.slug}`}
                    className="space-x-1 flex"
                  >
                    {getBoardIcon(board.type)}
                    <span>{board.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu> */}
          {isInJoined && (
            <>
              <ItemLink to={`/clubs/${data.club.id}/boards`}>게시판</ItemLink>
              <ItemLink to={`/clubs/${data.club.id}/matches`}>매치</ItemLink>
              <ItemLink to={`/clubs/${data.club.id}/members`}>멤버</ItemLink>
            </>
          )}
          {isAdmin && <ItemLink to={`/clubs/${data.club.id}/pendings`}>승인대기</ItemLink>}
        </div>
        <Outlet context={{ club: data.club, player: data.player }} />
      </div>
    </>
  );
};

// function ListItem({
//   title,
//   children,
//   href,
//   ...props
// }: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
//   return (
//     <li {...props}>
//       <NavigationMenuLink asChild>
//         <Link to={href}>
//           <div className="text-sm leading-none font-medium">{title}</div>
//           <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
//             {children}
//           </p>
//         </Link>
//       </NavigationMenuLink>
//     </li>
//   );
// }

export default Layout;
