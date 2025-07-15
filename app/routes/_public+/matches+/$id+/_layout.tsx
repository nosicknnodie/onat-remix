import { Outlet } from "@remix-run/react";

import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";

import dayjs from "dayjs";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";

export const handle = {
  breadcrumb: (match: any) => {
    const data = match.data;
    const params = match.params;
    return (
      <>
        <BreadcrumbLink to={"/matches/" + params.id}>
          {data.match.title}-{dayjs(data.match.stDate).format("M월D일(ddd)")}
        </BreadcrumbLink>
      </>
    );
  },
};

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

export type IMatchesIdLayoutPageLoaderReturnType = Awaited<
  ReturnType<typeof loader>
>;

const MatchesIdLayoutPage = (_props: IMatchesIdLayoutPageProps) => {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <Outlet context={data} />
    </>
  );
};

export default MatchesIdLayoutPage;
