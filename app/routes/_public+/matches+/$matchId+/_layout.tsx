/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";
import { detail as matches } from "~/features/matches/index.server";

export const handle = {
  breadcrumb: (match: any) => {
    const data = match.data;
    const params = match.params;
    return (
      <>
        <BreadcrumbLink to={`/matches/${params.matchId}`}>
          {data.match.title}-{dayjs(data.match.stDate).format("M월D일(ddd)")}
        </BreadcrumbLink>
      </>
    );
  },
};

interface IMatchesIdLayoutPageProps {}

export async function loader({ request: _request, params }: LoaderFunctionArgs) {
  const data = await matches.service.getMatchDetail(params.matchId!);
  if (!data) throw redirect("/404");
  return data;
}

export type IMatchesIdLayoutPageLoaderReturnType = Awaited<ReturnType<typeof loader>>;

const MatchesIdLayoutPage = (_props: IMatchesIdLayoutPageProps) => {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <Outlet context={data} />
    </>
  );
};

export default MatchesIdLayoutPage;
