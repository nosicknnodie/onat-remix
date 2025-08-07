import { Prisma } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useSession } from "~/contexts/AuthUserContext";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";

type Club = Prisma.ClubGetPayload<{
  include: {
    image: { select: { url: true } };
    emblem: { select: { url: true } };
  };
}>;

const RightComponent = (match: any) => {
  const user = useSession();
  if (!user) return null;
  return (
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
          <Link to="/clubs/new">클럽 생성</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const handle = {
  right: (match: any) => <RightComponent {...match} />,
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const [clubs, players] = await Promise.all([
    prisma.club.findMany({
      where: {
        OR: [
          { isPublic: true },
          {
            players: {
              some: {
                userId: user?.id || "",
                status: { in: ["APPROVED", "PENDING"] },
              },
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        image: { select: { url: true } },
        emblem: { select: { url: true } },
      },
    }),
    prisma.player.findMany({
      where: {
        userId: user?.id || "",
      },
    }),
  ]);
  const myClubs = clubs.filter((c) => players.some((p) => p.clubId === c.id));
  const publicClubs = clubs.filter((c) => !myClubs.includes(c));
  const categorized = {
    my: myClubs,
    public: publicClubs,
  };

  return { categorized, players };
}

interface IClubsPageProps {}

const ClubsPage = (_props: IClubsPageProps) => {
  const session = useSession();
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <div className="flex flex-col gap-4">
        <Tabs defaultValue={session ? "my" : "public"} className="w-full">
          <TabsList className="bg-transparent  space-x-2">
            {session && (
              <TabsTrigger
                value="my"
                className={cn(
                  "text-foreground pb-1 relative incline-block font-semibold hover:text-primary",
                  "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                  "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full"
                )}
              >
                나의 클럽
              </TabsTrigger>
            )}
            <TabsTrigger
              value="public"
              className={cn(
                "text-foreground pb-1 relative incline-block font-semibold hover:text-primary",
                "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full"
              )}
            >
              공개 클럽
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my">
            <ClubList clubs={loaderData.categorized.my} />
          </TabsContent>
          <TabsContent value="public">
            <ClubList clubs={loaderData.categorized.public} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

const ClubList = ({ clubs }: { clubs: Club[] }) => {
  const loaderData = useLoaderData<typeof loader>();
  const players = loaderData.players;
  return (
    <>
      <div className="grid max-sm:grid-cols-1 sm:max-xl:grid-cols-3 xl:grid-cols-4 gap-4">
        {clubs.length === 0 && (
          <div className="col-span-3 text-center">
            <p>클럽이 없습니다.</p>
          </div>
        )}
        {clubs.map((club) => {
          const myPlayer = players.find((p) => p.clubId === club.id);
          const isStatePending = myPlayer?.status === "PENDING";
          return (
            <div
              key={club.id}
              className="border rounded-lg shadow-sm overflow-hidden relative"
            >
              {isStatePending && (
                <Badge
                  className="absolute top-2 right-2 text-xs"
                  variant="destructive"
                >
                  가입대기
                </Badge>
              )}
              <Link to={`/clubs/${club.id}`}>
                <img
                  src={club.image?.url || "/images/club-default-image.webp"}
                  alt="대표 이미지"
                  className="w-full h-32 object-cover mb-2"
                />
              </Link>
              <div className="flex justify-end px-2">
                <p className="text-xs text-gray-500">
                  {club.si || "-"} {club.gun || "-"} /
                  {club.isPublic ? "공개" : "비공개"}
                </p>
              </div>
              <div className="flex p-2 gap-2 items-center overflow-hidden w-full">
                <Link to={`/clubs/${club.id}`} className="flex-shrink-0">
                  <img
                    src={club.emblem?.url || "/images/club-default-emblem.webp"}
                    alt="엠블럼"
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                </Link>
                <div className="flex-shrink min-w-0 w-full">
                  <Link
                    to={`/clubs/${club.id}`}
                    className="text-xl font-semibold"
                  >
                    {club.name}
                  </Link>
                  <p className="text-sm text-muted-foreground truncate w-full ">
                    {club.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ClubsPage;
