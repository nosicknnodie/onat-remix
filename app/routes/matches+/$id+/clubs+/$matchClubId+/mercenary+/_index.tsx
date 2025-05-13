import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import DataTable from "~/components/DataTable";
import { Button } from "~/components/ui/button";
import { prisma } from "~/libs/db/db.server";
import { mercenaryColumns } from "./_columns";

export async function loader({ params }: LoaderFunctionArgs) {
  const matchId = params.id;
  const matchClubId = params.matchClubId;

  try {
    const matchClub = await prisma.matchClub.findUnique({
      where: {
        id: matchClubId,
      },
    });

    if (!matchClub) return redirect("/matches/" + matchId + "/clubs/" + matchClubId);

    const mercenaries = await prisma.mercenary.findMany({
      where: {
        clubId: matchClub?.clubId,
      },
      include: {
        attendances: true,
        user: {
          include: {
            userImage: true,
          },
        },
      },
    });

    const attedMercenaries = mercenaries.filter((mer) =>
      mer.attendances.some((a) => a.matchClubId === matchClubId && a.isVote),
    );

    return { mercenaries, attedMercenaries };
  } catch (e) {
    console.error("e - ", e);
    return redirect("/matches/" + matchId + "/clubs/" + matchClubId);
  }
}

interface IMatchClubMecenaryPageProps {}

const MatchClubMecenaryPage = (_props: IMatchClubMecenaryPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const attedMercenaries = loaderData.attedMercenaries;
  const mercenaries = loaderData.mercenaries;
  return (
    <>
      <div className="space-y-2">
        <div>
          <p>참석용병</p>
          <div>
            {attedMercenaries.map((mer) => (
              <div key={mer.id}>
                <p>{mer.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <p>용병리스트 (History)</p>
            <Button variant={"outline"} asChild>
              <Link to={"./new"}>+ 용병 추가</Link>
            </Button>
          </div>
          <DataTable data={mercenaries} columns={mercenaryColumns} />
        </div>
      </div>
    </>
  );
};

export default MatchClubMecenaryPage;
