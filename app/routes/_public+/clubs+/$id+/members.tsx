import type { Player } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useLocation } from "@remix-run/react";
import { useMemo } from "react";
import DataTable from "~/components/DataTable";
import { prisma } from "~/libs/db/db.server";
import { PlayersContext } from "./_components/member.context";
import { memberColumns } from "./_components/members.columns";
export const handle = { breadcrumb: "멤버" };
interface IMembersPageProps {}

export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const clubId = params.id;

  if (!clubId) {
    return Response.json({ error: "clubId is required" }, { status: 400 });
  }
  try {
    const players = await prisma.player.findMany({
      where: {
        clubId: clubId,
        status: "APPROVED",
      },
      include: {
        user: {
          include: {
            userImage: true,
          },
        },
      },
    });

    return Response.json({ players });
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

export type IMembersPageLoaderData = {
  players: (Player & { user: { userImage: string } })[];
};

const MembersPage = (_props: IMembersPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const fetch = useFetcher<IMembersPageLoaderData>();
  const location = useLocation();
  const players = useMemo(
    () => fetch.data?.players ?? loaderData.players ?? [],
    [loaderData, fetch.data],
  );
  const value = {
    players,
    refetch: async () => {
      fetch.load(location.pathname);
    },
  };
  return (
    <>
      <PlayersContext.Provider value={value}>
        <DataTable data={value.players} columns={memberColumns} />
      </PlayersContext.Provider>
    </>
  );
};

export default MembersPage;
