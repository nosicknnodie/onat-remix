import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { prisma } from "~/libs/db/db.server";
import { Actions } from "./_Actions";
import { Board } from "./_Board";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId!;
  const matchClub = await prisma.matchClub.findUnique({
    where: {
      id: matchClubId,
    },
    include: {
      quarters: true,
      teams: true,
    },
  });
  if (!matchClub) return redirect("../");

  if (matchClub.quarters.length === 0) {
    const quarters = await Promise.all(
      [1, 2, 3, 4].map((num) =>
        prisma.quarter.create({
          data: {
            order: num,
            matchClubId,
          },
        }),
      ),
    );
    quarters.forEach((quarter) => {
      matchClub.quarters.push({ ...quarter });
    });
  }

  return { matchClub };
};

interface IPositionPageProps {}

const PositionPage = (_props: IPositionPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof loader>();
  const matchClub = fetcher.data?.matchClub ?? loaderData.matchClub;
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [isPending, startTransition] = useTransition();
  const quarterId = matchClub.quarters.find((quarter) => quarter.order === currentQuarter)?.id;
  const { data: quarters } = useQuery({
    queryKey: ["quarters", quarterId],
    queryFn: async () => {
      return fetch(`/api/quarters/${quarterId}`).then((res) => res.json());
    },
    enabled: !!(fetcher.state === "idle"),
  });
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
        fetcher.load(location.pathname);
      }
      setCurrentQuarter(order);
    });
  };
  const isLoading = fetcher.state !== "idle" || isPending;
  return (
    <div className="space-y-6">
      <section className="flex justify-between items-center">
        <div className="min-w-40"></div>
        <div className="flex justify-center items-center">
          <Button
            variant="ghost"
            disabled={currentQuarter === 1 || isLoading}
            onClick={() => setCurrentQuarter((prev) => prev - 1)}
          >
            <FaArrowLeft />
          </Button>
          <div>{currentQuarter} Q</div>
          <Button
            variant="ghost"
            disabled={isLoading}
            onClick={() => handleSetQuarter(currentQuarter + 1)}
          >
            <FaArrowRight />
          </Button>
        </div>
        <div className="min-w-40 flex justify-end">
          <Actions teams={matchClub.teams}>
            <Button className="" variant={"outline"}>
              포지션설정
            </Button>
          </Actions>
        </div>
      </section>
      {/* 자체전일 경우와 매칭일경우 두가지 타입에 따라서 다름 */}
      <Board teams={matchClub.teams} />
    </div>
  );
};

export default PositionPage;
