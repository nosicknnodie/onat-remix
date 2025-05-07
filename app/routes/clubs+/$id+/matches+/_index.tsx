import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
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
import { cn } from "~/libs/utils";
import ClubTab from "~/template/club/Tabs";
interface IMatchesPageProps {}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const club = await prisma.club.findUnique({
    where: {
      id: params.id,
    },
    include: {
      image: { select: { url: true } },
      emblem: { select: { url: true } },
    },
  });
  return Response.json({ club });
}

const MatchesPage = (_props: IMatchesPageProps) => {
  const data = useLoaderData<typeof loader>();
  const user = useSession();
  const params = useParams();
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/clubs">클럽</BreadcrumbLink>
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
        </div>
        <ClubTab club={data.club} />
      </div>
    </>
  );
};

export default MatchesPage;
