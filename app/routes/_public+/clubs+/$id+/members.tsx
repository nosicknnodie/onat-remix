import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useLocation } from "@remix-run/react";
import { useMemo } from "react";
import { service } from "~/features/clubs/index.server";
import Members from "~/features/clubs/ui/Members";
export const handle = { breadcrumb: "멤버" };
interface IMembersPageProps {}

export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const clubId = params.id;

  if (!clubId) {
    return { players: [] };
  }
  try {
    const players = await service.getClubMembers(clubId);
    return { players };
  } catch {
    return { players: [] };
  }
};

export type IPlayer = Awaited<ReturnType<typeof service.getClubMembers>>[number];

const MembersPage = (_props: IMembersPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const fetch = useFetcher<{ players: IPlayer[] }>();
  const location = useLocation();
  const players = useMemo(
    () => fetch.data?.players ?? loaderData.players ?? [],
    [loaderData, fetch.data],
  );
  return (
    <>
      <Members players={players} refetch={() => fetch.load(location.pathname)} />
    </>
  );
};

export default MembersPage;
