import type { Player } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useLocation } from "@remix-run/react";
import { useMemo } from "react";
import DataTable from "~/components/DataTable";
import { prisma } from "~/libs/db/db.server";
import { pendingsColumns } from "./_components/pendings.columns";
import { PendingsContext } from "./_components/pendings.context";

interface IPendingsPageProps {}
export const handle = { breadcrumb: "승인대기" };

export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const clubId = params.id;

  if (!clubId) {
    return Response.json({ error: "clubId is required" }, { status: 400 });
  }
  try {
    const players = await prisma.player.findMany({
      where: {
        clubId: clubId,
        status: "PENDING",
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

export type IPendingsPageLoaderData = {
  players: (Player & { user: { userImage: string } })[];
};
const PendingsPage = (_props: IPendingsPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const fetch = useFetcher<IPendingsPageLoaderData>();
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
      <PendingsContext.Provider value={value}>
        <DataTable data={value.players} columns={pendingsColumns} />
      </PendingsContext.Provider>
    </>
  );
};

export default PendingsPage;
