import { Club } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
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
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";

type LoaderData = {
  clubs: (Club & {
    image?: { url: string } | null;
    emblem?: { url: string } | null;
  })[];
};

export async function loader(_args: LoaderFunctionArgs) {
  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      image: { select: { url: true } },
      emblem: { select: { url: true } },
    },
  });
  return Response.json({ clubs });
}

interface IClubsPageProps {}

const ClubsPage = (_props: IClubsPageProps) => {
  const data = useLoaderData<LoaderData>();

  return (
    <>
      <div className="flex flex-col gap-4">
        <Breadcrumb className="flex-shrink-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              클럽
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
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grid grid-cols-3 gap-4">
          {data.clubs.map((club) => (
            <div
              key={club.id}
              className="border rounded-lg shadow-sm overflow-hidden"
            >
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
          ))}
        </div>
      </div>
    </>
  );
};

export default ClubsPage;
