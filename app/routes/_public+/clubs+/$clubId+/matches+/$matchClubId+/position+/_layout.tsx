import { Outlet, useLocation, useNavigate, useParams, useRouteLoaderData } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useTransition } from "react";
import { FaCircleArrowLeft, FaCircleArrowRight, FaRotateRight } from "react-icons/fa6";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { confirm } from "~/components/ui/confirm";
import { useMembershipInfoQuery, usePlayerPermissionsQuery } from "~/features/clubs/isomorphic";
import {
  PositionContext,
  useMatchClubQuery,
  usePositionUpdate,
} from "~/features/matches/isomorphic";
import { useIsMobile } from "~/hooks/use-mobile";
import { cn } from "~/libs";
import type { loader as rootLoader } from "~/root";

export const handle = {
  breadcrumb: () => {
    return <>포지션</>;
  },
};

const PositionLayout = () => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const isMobile = useIsMobile();
  const [currentQuarterOrder, setCurrentQuarterOrder] = useState(1);
  const [isLoading, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
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
  const currentQuarter = matchClub?.quarters.find(
    (quarter) => quarter.order === currentQuarterOrder,
  );
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
  const wsUrl =
    rootData?.env.WS_SERVER_URL && currentQuarter?.id
      ? `${rootData.env.WS_SERVER_URL}/position?id=${currentQuarter.id}`
      : null;
  usePositionUpdate({ url: wsUrl, matchClubId: matchClub?.id });
  /**
   * 쿼터가 최대 쿼터보다 많으면 증가시킴
   * @param quarter
   */
  const refreshPositionData = async () => {
    if (!matchClubId) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        matchClubQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ["matchClub", matchClubId, "position", "attendances"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["matchClub", matchClubId, "position", "quarters"],
        }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const createQuarterForMatch = async (order: number) => {
    if (!matchClubId) return;
    const response = await fetch("/api/quarters/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchClubId, order }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
      throw new Error(body?.error ?? "쿼터 생성에 실패했습니다.");
    }
  };

  const handleSetQuarter = (order: number) => {
    startTransition(() => {
      if (!quarters) return;
      const quarterId = quarters.find((quarter) => quarter.order === order)?.id;
      if (!quarterId) {
        const maxOrder = quarters.reduce((max, q) => (q.order > max ? q.order : max), 0);
        const nextOrder = maxOrder + 1;
        confirm({
          title: `${nextOrder}쿼터를 생성할까요?`,
          description: "생성 후 해당 쿼터로 이동합니다.",
          confirmText: "생성",
          cancelText: "취소",
        }).onConfirm(async () => {
          try {
            await createQuarterForMatch(nextOrder);
            await refreshPositionData();
            setCurrentQuarterOrder(nextOrder);
          } catch (error) {
            console.error(error);
          }
        });
        return;
      }
      setCurrentQuarterOrder(order);
    });
  };

  const handleRefresh = async () => {
    if (!quarters || quarters.length === 0) {
      confirm({
        title: "아직 생성된 쿼터가 없어요.",
        description: "1쿼터를 생성하시겠어요?",
        confirmText: "생성",
        cancelText: "취소",
      }).onConfirm(async () => {
        try {
          await createQuarterForMatch(1);
          await refreshPositionData();
          setCurrentQuarterOrder(1);
        } catch (error) {
          console.error(error);
        }
      });
      return;
    }
    await refreshPositionData();
  };

  const handleDeleteQuarter = () => {
    if (!quarters || currentQuarterOrder < 5) return;
    const targetQuarter = quarters.find((quarter) => quarter.order === currentQuarterOrder);
    if (!targetQuarter) return;

    confirm({
      title: "선택한 쿼터를 삭제할까요?",
      description: "삭제한 쿼터는 복구할 수 없습니다.",
      confirmText: "삭제",
      cancelText: "취소",
    }).onConfirm(async () => {
      try {
        const res = await fetch(`/api/quarters/${targetQuarter.id}`, { method: "DELETE" });
        if (!res.ok) {
          const body = (await res.json().catch(() => undefined)) as { error?: string } | undefined;
          throw new Error(body?.error ?? "쿼터 삭제에 실패했습니다.");
        }
        await handleRefresh();
        setCurrentQuarterOrder((prev) => Math.max(1, prev - 1));
      } catch (error) {
        console.error(error);
      }
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

  const renderTabs = (isCan: boolean) => {
    if (!canManage || !isCan) {
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
      value={{
        currentQuarterOrder,
        currentQuarter,
        currentTeamId: isSelf ? (teamIdParam ?? null) : null,
      }}
    >
      <div className="flex flex-col space-y-2">
        {renderTabs(isMobile)}
        <section className="flex justify-between items-center relative w-full min-h-8">
          <div>{renderTabs(!isMobile)}</div>
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1"
            >
              <span className="sr-only">포지션 새로고침</span>
              <FaRotateRight className={cn(isRefreshing && "animate-spin")} />
            </Button>
            {currentQuarterOrder >= 5 && (
              <Button variant="destructive" onClick={handleDeleteQuarter} className="gap-1">
                삭제
              </Button>
            )}
          </div>
        </section>
        <Outlet />
      </div>
    </PositionContext.Provider>
  );
};

export default PositionLayout;
