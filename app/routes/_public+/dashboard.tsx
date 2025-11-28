import { useNavigate } from "@remix-run/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useSession } from "~/contexts";
import { PerformanceSection, UpcomingMatches } from "~/features/dashboard/client";
import {
  dashboardQueryKeys,
  usePerformanceHistoryQuery,
  useUpcomingAttendancesQuery,
} from "~/features/dashboard/isomorphic";
import { useToast } from "~/hooks/use-toast";
import { postJson } from "~/libs/client/api-client";

export const handle = {
  breadcrumb: "대시보드",
};

interface IDashBoardPageProps {}

const DashBoardPage = (_props: IDashBoardPageProps) => {
  return <DashboardContent />;
};

const DashboardContent = () => {
  const navigate = useNavigate();
  const user = useSession();
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
  const { data: performanceData, isLoading: isPerformanceLoading } =
    usePerformanceHistoryQuery(selectedYear);
  const { data: upcomingMatches, isLoading: isUpcomingLoading } = useUpcomingAttendancesQuery();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const attendanceMutation = useMutation({
    mutationFn: async (input: {
      type: "vote" | "check";
      matchClubId: string;
      clubId: string;
      isVote: boolean;
      isCheck: boolean;
    }) => {
      const { matchClubId, ...body } = input;
      return postJson(`/api/matchClubs/${matchClubId}/attendance`, body);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: dashboardQueryKeys.upcomingAttendances });
      const previous = queryClient.getQueryData<typeof upcomingMatches>(
        dashboardQueryKeys.upcomingAttendances,
      );
      queryClient.setQueryData<typeof upcomingMatches>(
        dashboardQueryKeys.upcomingAttendances,
        (old) => {
          if (!old) return old;
          return old.map((match) =>
            match.matchClubId === input.matchClubId
              ? {
                  ...match,
                  userAttendance: {
                    isVote: input.isVote,
                    isCheck: input.isCheck,
                    voteTime: input.isVote
                      ? new Date().toISOString()
                      : match.userAttendance?.voteTime,
                  },
                }
              : match,
          );
        },
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dashboardQueryKeys.upcomingAttendances, context.previous);
      }
      toast({
        variant: "destructive",
        description: "처리 중 오류가 발생했어요. 다시 시도해 주세요.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.upcomingAttendances });
    },
  });
  const _now = dayjs();

  const handleVote = async (item: NonNullable<typeof upcomingMatches>[number], isVote: boolean) => {
    if (attendanceMutation.isPending) return;
    const currentCheck = item.userAttendance?.isCheck ?? false;
    try {
      await attendanceMutation.mutateAsync({
        type: "vote",
        matchClubId: item.matchClubId,
        clubId: item.clubId,
        isVote,
        isCheck: currentCheck,
      });
      toast({
        description: isVote ? "참석으로 저장했어요." : "불참으로 저장했어요.",
      });
    } catch {
      toast({
        variant: "destructive",
        description: "처리 중 오류가 발생했어요. 다시 시도해 주세요.",
      });
    }
  };

  const handleCheck = async (item: NonNullable<typeof upcomingMatches>[number]) => {
    if (attendanceMutation.isPending) return;
    const currentVote = item.userAttendance?.isVote ?? false;
    const currentCheck = item.userAttendance?.isCheck ?? false;
    try {
      await attendanceMutation.mutateAsync({
        type: "check",
        matchClubId: item.matchClubId,
        clubId: item.clubId,
        isVote: currentVote,
        isCheck: !currentCheck,
      });
      toast({
        description: !currentCheck ? "출석 완료" : "출석을 해제했어요.",
      });
    } catch {
      // 에러 토스트는 onError에서 처리
    }
  };

  useEffect(() => {
    if (user === null) {
      navigate("/auth/login", { replace: true });
    }
  }, [navigate, user]);
  if (!user) return null;

  return (
    <div className="w-full sm:p-4 max-sm:p-1 rounded-lg grid sm:grid-cols-3 gap-3">
      {/** `프로필 box` */}
      <div className="sm:col-span-2 border border-gray-200 bg-white rounded-lg sm:p-8 max-sm:p-4 flex-col flex justify-start relative gap-4">
        <div className="absolute top-[8%] right-[5%]">
          <Button
            className=""
            variant="outline"
            size={"icon"}
            onClick={() => navigate("/settings/edit")}
          >
            <FaEdit className="text-primary" />
          </Button>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            <Avatar className="size-24 bg-white">
              <AvatarImage src={user.userImage?.url ?? "/images/user_empty.png"} />
              <AvatarFallback className="bg-primary-foreground"> </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="space-x-2">
                <span className="text-2xl font-bold ">{user.nick ?? user.name ?? "이름 없음"}</span>
                <span>{user.name && `(${user.name})`}</span>
              </p>
              <p className="text-sm">{user.email}</p>
              <div className="flex gap-1">
                {user.si && (
                  <Badge className="h-5" variant={"secondary"}>
                    {user.si}
                  </Badge>
                )}
                {user.gun && (
                  <Badge className="h-5" variant={"secondary"}>
                    {user.gun}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 text-sm gap-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-primary">생년월일</span>
            <span className="truncate ">{dayjs(user.birth).format("YYYY. M. D")}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-primary">포지션</span>
            <span className="truncate ">
              {[user.position1, user.position2, user.position3].filter(Boolean).join(", ")}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-primary">키</span>
            <span className="truncate">{user.height}</span>
          </div>
        </div>
      </div>
      <UpcomingMatches
        items={upcomingMatches ?? []}
        isLoading={isUpcomingLoading}
        isPending={attendanceMutation.isPending}
        onVote={handleVote}
        onCheck={handleCheck}
      />
      <PerformanceSection
        data={performanceData}
        isLoading={isPerformanceLoading}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
    </div>
  );
};

export default DashBoardPage;
