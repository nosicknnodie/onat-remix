import { Outlet, useLocation, useNavigate, useParams } from "@remix-run/react";
import { useEffect, useState, useTransition } from "react";
import { FaCircleArrowLeft, FaCircleArrowRight } from "react-icons/fa6";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { useMembershipInfoQuery, usePlayerPermissionsQuery } from "~/features/clubs/isomorphic";
import { PositionContext, useMatchClubQuery } from "~/features/matches/isomorphic";

export const handle = {
  breadcrumb: () => {
    return <>포지션</>;
  },
};

const PositionLayout = () => {
  const [currentQuarterOrder, setCurrentQuarterOrder] = useState(1);
  const [isLoading, startTransition] = useTransition();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const matchClubId = params.matchClubId;
  const matchClubQuery = useMatchClubQuery(matchClubId, { enabled: Boolean(matchClubId) });
  const { data: membership } = useMembershipInfoQuery(params.clubId ?? "", {
    enabled: Boolean(params.clubId),
  });
  const { data: permissions = [] } = usePlayerPermissionsQuery(membership?.id ?? "", {
    enabled: Boolean(membership?.id),
  });
  const canManage = permissions.includes("MATCH_MANAGE");
  const matchClub = matchClubQuery.data?.matchClub;
  const quarters = matchClub?.quarters;
  const isSelf = Boolean(matchClub?.isSelf);
  const team1 = matchClub?.teams?.[0];
  const team2 = matchClub?.teams?.[1];
  const teamIdParam = params.teamId ?? null;
  const basePositionPath =
    params.clubId && params.matchClubId
      ? `/clubs/${params.clubId}/matches/${params.matchClubId}/position`
      : null;
  const isTeamRoute = Boolean(teamIdParam);
  const isSettingRoute = basePositionPath
    ? location.pathname === `${basePositionPath}/setting`
    : false;
  const isLoadingQuarters = matchClubQuery.isLoading || !quarters;
  /**
   * 쿼터가 최대 쿼터보다 많으면 증가시킴
   * @param quarter
   */
  const handleSetQuarter = (order: number) => {
    startTransition(async () => {
      if (!quarters) return;
      const quarterId = quarters.find((quarter) => quarter.order === order)?.id;
      if (!quarterId) {
        const maxOrder = quarters.reduce((max, q) => {
          return q.order > max ? q.order : max;
        }, 0);
        await fetch("/api/quarters/new", {
          method: "POST",
          body: JSON.stringify({
            matchClubId,
            order: maxOrder + 1,
          }),
        });
        await matchClubQuery.refetch();
      }
      setCurrentQuarterOrder(order);
    });
  };

  useEffect(() => {
    if (!isSelf && teamIdParam && basePositionPath) {
      navigate(basePositionPath, { replace: true });
    }
  }, [isSelf, teamIdParam, basePositionPath, navigate]);

  if (isLoadingQuarters) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  const handleTeamSelect = (teamId: string | null) => {
    if (!basePositionPath || !teamId) return;
    navigate(`${basePositionPath}/teams/${teamId}`);
  };

  const handleViewSelect = () => {
    if (!basePositionPath) return;
    navigate(basePositionPath);
  };

  const handleSettingSelect = () => {
    if (!basePositionPath) return;
    navigate(`${basePositionPath}/setting`);
  };

  const renderTabs = () => {
    if (!canManage) {
      return null;
    }
    if (!isSelf) {
      return (
        <div className="flex items-center justify-center">
          <Button
            size="sm"
            variant={!isSettingRoute ? "default" : "ghost"}
            onClick={handleViewSelect}
          >
            VIEW
          </Button>
          <Button
            size="sm"
            variant={isSettingRoute ? "default" : "ghost"}
            onClick={handleSettingSelect}
          >
            SETTING
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant={isTeamRoute && teamIdParam === team1?.id ? "default" : "ghost"}
          disabled={!team1}
          onClick={() => handleTeamSelect(team1?.id ?? null)}
          className="min-w-20"
        >
          {team1?.name ?? "Team A"}
        </Button>
        <Button
          size="sm"
          variant={!isTeamRoute ? "default" : "ghost"}
          onClick={handleViewSelect}
          className="min-w-20"
        >
          VIEW
        </Button>
        <Button
          size="sm"
          variant={isTeamRoute && teamIdParam === team2?.id ? "default" : "ghost"}
          disabled={!team2}
          onClick={() => handleTeamSelect(team2?.id ?? null)}
          className="min-w-20"
        >
          {team2?.name ?? "Team B"}
        </Button>
      </div>
    );
  };

  return (
    <PositionContext.Provider
      value={{ currentQuarterOrder, currentTeamId: isSelf ? (teamIdParam ?? null) : null }}
    >
      <div className="flex flex-col space-y-2">
        {renderTabs()}
        <section className="flex justify-between items-center relative w-full min-h-8">
          <div></div>
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center">
            <Button
              variant="ghost"
              disabled={currentQuarterOrder === 1 || isLoading}
              onClick={() => setCurrentQuarterOrder((prev) => prev - 1)}
            >
              {/* left */}
              <span className="sr-only">이전</span>
              <FaCircleArrowLeft />
            </Button>
            <div className="flex justify-center items-center w-4">{currentQuarterOrder}</div>
            <Button
              variant="ghost"
              disabled={isLoading}
              onClick={() => handleSetQuarter(currentQuarterOrder + 1)}
            >
              {/* right */}
              <span className="sr-only">다음</span>
              <FaCircleArrowRight />
            </Button>
          </div>
          <div></div>
        </section>
        <Outlet />
      </div>
    </PositionContext.Provider>
  );
};

export default PositionLayout;
