import { useNavigate, useParams, useRouteLoaderData, useSearchParams } from "@remix-run/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { PositionBoardSection } from "~/features/matches/client";
import {
  PositionContext,
  usePositionQuery,
  useQuarterQuery,
  useTeamQuery,
} from "~/features/matches/isomorphic";
import type { loader as rootLoader } from "~/root";
export const handle = {
  breadcrumb: () => {
    return <>포지션</>;
  },
};

interface IPositionPageProps {}

const PositionPage = (_props: IPositionPageProps) => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quarterOrder = searchParams.get("quarterOrder");
  const matchClubId = params.matchClubId;
  const quarterQuery = useQuarterQuery(matchClubId, { enabled: Boolean(matchClubId) });
  const matchClub = quarterQuery.data?.matchClub;
  const [currentQuarterOrder, setCurrentQuarterOrder] = useState(Number(quarterOrder || 1));
  const [isPending, startTransition] = useTransition();
  const attendanceQuery = usePositionQuery(matchClub?.id, { enabled: Boolean(matchClub?.id) });
  const teamQuery = useTeamQuery(matchClub?.id, {
    clubId: params.clubId,
    enabled: Boolean(params.clubId && matchClub?.id),
  });

  useEffect(() => {
    if (quarterQuery.error && quarterQuery.error instanceof Response) {
      if (quarterQuery.error.status === 404) {
        navigate("../");
      }
    }
  }, [navigate, quarterQuery.error]);

  const teamResponse = teamQuery.data;
  const teams = teamResponse && "teams" in teamResponse ? teamResponse.teams : [];
  useEffect(() => {
    if (teamResponse && "redirectTo" in teamResponse) {
      navigate(teamResponse.redirectTo);
    }
  }, [navigate, teamResponse]);

  const isLoadingQuarters = quarterQuery.isLoading || !matchClub;
  const positionQueryValue = useMemo(
    () => ({ currentQuarterOrder, query: attendanceQuery }),
    [attendanceQuery, currentQuarterOrder],
  );
  if (isLoadingQuarters) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }
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
        await quarterQuery.refetch();
      }
      setCurrentQuarterOrder(order);
    });
  };

  const isLoading = isPending;

  return (
    <PositionContext.Provider value={positionQueryValue}>
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
        <PositionBoardSection
          matchClub={matchClub}
          teams={teams}
          wsServerUrl={rootData?.env.WS_SERVER_URL}
        />
      </div>
    </PositionContext.Provider>
  );
};

export default PositionPage;
