import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import {
  Link,
  Outlet,
  UIMatch,
  useLoaderData,
  useLocation,
  useMatches,
  useParams,
} from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";

import { Board, Club, File, Player } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { ChevronDown } from "lucide-react";
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
import { NavigationMenuLink } from "~/components/ui/navigation-menu";
import { useSession } from "~/contexts/AuthUserContext";
import { getUser } from "~/libs/db/lucia.server";
import { getBoardIcon } from "~/libs/getBoardIcons";
import JoinDialog from "~/template/club/JoinDialog";

export const handle = {
  breadcrumb: (match: any) => {
    const data = match.data;
    const params = match.params;
    return (
      <>
        <BreadcrumbLink to={"/clubs/" + params.id}>
          {data.club.name}
        </BreadcrumbLink>
      </>
    );
  },
  right: (match: any) => {
    const data = match.data;
    const params = match.params;
    return (
      <>
        {(data.player?.role === "MANAGER" ||
          data.player?.role === "MASTER") && (
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
                <Link to={`/clubs/${params.id}/edit`}>클럽 수정</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={"/matches/new"}>매치 추가</Link>
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
        boards: true,
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
    boards?: Board[];
  };
  player: (Player & { user: { userImage: string } }) | null;
};

const Layout = (_props: ILayoutProps) => {
  const data = useLoaderData<IClubLayoutLoaderData>();
  const user = useSession();
  const params = useParams();
  const location = useLocation();
  const matches = useMatches() as UIMatch<
    unknown,
    { breadcrumb?: React.ReactNode }
  >[];

  const breadcrumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      name: match.handle.breadcrumb,
      path: match.pathname.endsWith("/")
        ? match.pathname.slice(0, -1)
        : match.pathname,
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

  const boards = data.club.boards;

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
            {isRejected && (
              <FormError className="py-2">가입 승인 거절되었습니다.</FormError>
            )}
            {isJoinPending && (
              <FormSuccess>가입 승인 대기중입니다.</FormSuccess>
            )}
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
          {/* <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <div
                    className={cn(
                      "text-foreground pb-1 relative incline-block font-semibold hover:text-primary",
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
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                          href="/"
                        >
                          <div className="mt-4 mb-2 text-lg font-medium">
                            shadcn/ui
                          </div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            Beautifully designed components built with Tailwind
                            CSS.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/docs" title="Introduction">
                      Re-usable components built using Radix UI and Tailwind
                      CSS.
                    </ListItem>
                    <ListItem href="/docs/installation" title="Installation">
                      How to install dependencies and structure your app.
                    </ListItem>
                    <ListItem
                      href="/docs/primitives/typography"
                      title="Typography"
                    >
                      Styles for headings, paragraphs, lists...etc
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu> */}

          <DropdownMenu>
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
              {/* <DropdownMenuItem asChild>
                <Link
                  to={`/clubs/${data.club.id}/boards/free`}
                  className="space-x-1"
                >
                  <FaComments className="text-primary" />{" "}
                  <span>자유게시판</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={`/clubs/${data.club.id}/boards/photo`}
                  className="space-x-1"
                >
                  <MdPhotoLibrary className="text-primary" />{" "}
                  <span>사진게시판</span>
                </Link>
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <ItemLink to={`/clubs/${data.club.id}/boards`}>게시판</ItemLink> */}
          <ItemLink to={`/clubs/${data.club.id}/matches`}>매치</ItemLink>
          <ItemLink to={`/clubs/${data.club.id}/members`}>멤버</ItemLink>
          <ItemLink to={`/clubs/${data.club.id}/pendings`}>승인대기</ItemLink>
        </div>
        <Outlet context={{ club: data.club, player: data.player }} />
      </div>
    </>
  );
};

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link to={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export default Layout;
