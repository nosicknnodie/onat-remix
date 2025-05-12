import { Outlet } from "@remix-run/react";

import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, UIMatch, useLoaderData, useMatches, useParams } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
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
interface IMatchesIdLayoutPageProps {}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const [match] = await Promise.all([
    prisma.match.findUnique({
      where: {
        id: params.id,
      },
      include: {
        matchClubs: {
          include: {
            club: { include: { image: true, emblem: true } },
          },
        },
      },
    }),
  ]);

  if (!match) {
    throw redirect("/404");
  }

  return { match };
}

export type IMatchesIdLayoutPageLoaderReturnType = Awaited<ReturnType<typeof loader>>;

const MatchesIdLayoutPage = (_props: IMatchesIdLayoutPageProps) => {
  const params = useParams();
  const user = useSession();
  const data = useLoaderData<typeof loader>();
  const matches = useMatches() as UIMatch<unknown, { breadcrumb?: React.ReactNode }>[];
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
                <BreadcrumbLink to={"/matches/" + params.id}>
                  {data.match.title}-{dayjs(data.match.stDate).format("M월D일(ddd)")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {params.matchClubId && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {data.match.matchClubs.find((mc) => mc.id === params.matchClubId)?.club.name}
                    {/* <BreadcrumbLink to={`/matches/${params.id}/clubs/${params.matchClubId}`}>
                    </BreadcrumbLink> */}
                  </BreadcrumbItem>
                </>
              )}
              {/* {breadcrumbs.map((breadcrumb) => (
                <Fragment key={breadcrumb.path}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink to={breadcrumb.path}>{breadcrumb.name}</BreadcrumbLink>
                  </BreadcrumbItem>
                </Fragment>
              ))} */}
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Outlet context={data} />
      </div>
    </>
  );
};

export default MatchesIdLayoutPage;
