import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useState, useTransition } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { prisma } from "~/libs/db/db.server";
import { Board } from "./_Board";
import { PositionContext } from "./_position.context";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId!;
  const matchClub = await prisma.matchClub.findUnique({
    where: {
      id: matchClubId,
    },
    include: {
      quarters: { include: { team1: true, team2: true } },
      teams: true,
    },
  });
  if (!matchClub) return redirect("../");

  return { matchClub };
};

interface IPositionPageProps {}

const PositionPage = (_props: IPositionPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const matchClub = loaderData.matchClub;
  const [currentQuarterOrder, setCurrentQuarterOrder] = useState(1);
  const [isPending, startTransition] = useTransition();
  /**
   * 쿼터가 최대 쿼터보다 많으면 증가시킴
   * @param quarter
   */
  const handleSetQuarter = (order: number) => {
    startTransition(async () => {
      const quarterId = matchClub.quarters.find((quarter) => quarter.order === order)?.id;
      if (!quarterId) {
        const maxOrder = matchClub.quarters.reduce((max, q) => {
          return q.order > max ? q.order : max;
        }, 0);
        await fetch("/api/quarters/new", {
          method: "POST",
          body: JSON.stringify({
            matchClubId: matchClub.id,
            order: maxOrder + 1,
          }),
        });
        revalidate();
      }
      setCurrentQuarterOrder(order);
    });
  };
  const isLoading = isPending;
  return (
    <PositionContext.Provider value={{ currentQuarterOrder }}>
      <div className="lg:space-y-6 max-lg:space-y-2">
        <section className="flex justify-center items-center">
          <div className="flex justify-center items-center">
            <Button
              variant="ghost"
              disabled={currentQuarterOrder === 1 || isLoading}
              onClick={() => setCurrentQuarterOrder((prev) => prev - 1)}
            >
              <FaArrowLeft />
            </Button>
            <div>{currentQuarterOrder} Q</div>
            <Button
              variant="ghost"
              disabled={isLoading}
              onClick={() => handleSetQuarter(currentQuarterOrder + 1)}
            >
              <FaArrowRight />
            </Button>
          </div>
        </section>
        {/* 자체전일 경우와 매칭일경우 두가지 타입에 따라서 다름 */}
        <Board />
      </div>
    </PositionContext.Provider>
  );
};

export default PositionPage;
