import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useLocation } from "@remix-run/react";
import { useMemo } from "react";
import { service } from "~/features/clubs/index.server";
import Pendings from "~/features/clubs/ui/Pendings";

interface IPendingsPageProps {}
export const handle = { breadcrumb: "승인대기" };

export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const clubId = params.id;

  if (!clubId) {
    return { players: [] };
  }
  try {
    const players = await service.getPendingClubMembers(clubId);
    return { players };
  } catch {
    return { players: [] };
  }
};

export type IPlayer = Awaited<ReturnType<typeof loader>>["players"][number];
const PendingsPage = (_props: IPendingsPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const fetch = useFetcher<{ players: IPlayer[] }>();
  const location = useLocation();
  const players = useMemo(
    () => fetch.data?.players ?? loaderData.players ?? [],
    [loaderData, fetch.data],
  );
  return (
    <>
      <Pendings players={players} refetch={() => fetch.load(location.pathname)} />
    </>
  );
};

export default PendingsPage;
