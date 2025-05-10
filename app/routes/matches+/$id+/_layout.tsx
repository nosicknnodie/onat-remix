import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, Outlet, UIMatch, useLoaderData, useMatches, useParams } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";

import { Match, MatchClub } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Fragment } from "react/jsx-runtime";
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

interface IMatchesIdLayoutPageProps {}

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
  const [match] = await Promise.all([
    prisma.match.findUnique({
      where: {
        id: params.id,
      },
      include: {
        matchClubs: {
          where: {
            club: {
              players: {
                some: {
                  userId: user?.id,
                  status: "APPROVED",
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!match) {
    throw redirect("/404");
  }

  return Response.json({ match });
}

export type IMatchLayoutLoaderData = {
  match: Match & {
    matchClub: MatchClub[];
  };
};

const MatchesIdLayoutPage = (_props: IMatchesIdLayoutPageProps) => {
  const user = useSession();
  const data = useLoaderData<IMatchLayoutLoaderData>();
  const matches = useMatches() as UIMatch<unknown, { breadcrumb?: React.ReactNode }>[];
  const params = useParams();
  const breadcrumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      name: match.handle.breadcrumb,
      path: match.pathname.endsWith("/") ? match.pathname.slice(0, -1) : match.pathname,
    }));
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
                <BreadcrumbLink to="/matches">매치</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink to={"/matches/" + params.id}>{data.match.title}</BreadcrumbLink>
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
                {data.match.createUserId === user?.id && (
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
                        <Link to={`/matches/${params.id}/edit`}>매치 수정</Link>
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem asChild>
                        <Link to={"/matches/new"}>매치 추가</Link>
                      </DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Outlet context={{ match: data.match }} />
      </div>
    </>
  );
};

export default MatchesIdLayoutPage;
