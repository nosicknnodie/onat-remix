import { Club, File, Player } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
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
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";
import JoinDialog from "~/template/club/JoinDialog";
import ClubTab from "~/template/club/Tabs";
interface IClubPageProps {}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
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
      ? prisma.player.findUnique({
          where: {
            clubId_userId: {
              userId: user.id,
              clubId: params.id!,
            },
          },
        })
      : null,
  ]);
  return Response.json({ club, player });
}

type ILoaderType = {
  club: Club & { image?: File | null; emblem?: File | null };
  player: Player | null;
};

const ClubPage = (_props: IClubPageProps) => {
  const user = useSession();
  const data: ILoaderType = useLoaderData<typeof loader>();
  const club = data.club;
  if (!club) return null;
  const params = useParams();
  //   PENDING
  // APPROVED
  // REJECTED
  // LEFT
  // BANNED

  // 가입버튼
  const isJoined = !!user && !data.player;
  // 재가입버튼
  const isReJoined =
    user &&
    data.player &&
    new Date(Date.now() - 1000 * 60 * 60) < new Date(data.player.updatedAt) &&
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
      <div className="flex flex-col gap-4">
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
                {data.club.name}
                {user?.id === data.club.ownerUserId && (
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* 가입하기 버튼 */}
          {isJoined && (
            <JoinDialog>
              <Button>가입</Button>
            </JoinDialog>
          )}
          {isRejected && <FormError>가입 승인 거절되었습니다.</FormError>}
          {isJoinPending && <FormSuccess>가입 승인 대기중입니다.</FormSuccess>}
          {isReJoined && (
            <JoinDialog player={data.player ?? undefined}>
              <Button>재가입</Button>
            </JoinDialog>
          )}
        </div>
        <ClubTab club={data.club} />
        <div className="rounded-lg overflow-hidden shadow border">
          <img
            src={data.club?.image?.url || "/images/club-default-image.webp"}
            alt="대표 이미지"
            className="w-full h-52 object-cover"
          />
          <div className="p-6 flex items-start gap-4">
            <img
              src={data.club?.emblem?.url || "/images/club-default-emblem.webp"}
              alt="엠블럼"
              className="w-16 h-16 object-cover rounded-full border"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold">{data.club.name}</h2>
              <p className="text-muted-foreground text-sm">
                {data.club.description || "클럽 소개가 없습니다."}
              </p>
              <p className="text-xs text-gray-500">
                지역: {data.club.si || "-"} {data.club.gun || "-"} /{" "}
                {data.club.isPublic ? "공개" : "비공개"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClubPage;
