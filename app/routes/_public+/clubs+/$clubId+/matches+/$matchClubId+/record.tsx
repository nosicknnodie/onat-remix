//
import { AvatarFallback } from "@radix-ui/react-avatar";
import { useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useState, useTransition } from "react";
import { FaFutbol } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { confirm } from "~/components/ui/confirm";
import { useMembershipInfoQuery, usePlayerPermissionsQuery } from "~/features/clubs/isomorphic";
import { GoalItem, QuarterRecord, RecordRegister } from "~/features/matches/client";
import {
  getAttendanceDisplayName,
  useMatchClubQuery,
  useRecordQuery,
} from "~/features/matches/isomorphic";

interface IRecordPageProps {}

export const handle = {
  breadcrumb: () => {
    return <>기록</>;
  },
};

const RecordPage = (_props: IRecordPageProps) => {
  const params = useParams();
  const matchClubId = params.matchClubId;
  const clubId = params.clubId ?? "";
  const { data, isLoading, refetch } = useRecordQuery(matchClubId, {
    enabled: Boolean(matchClubId),
  });
  const { data: matchClubQueryData } = useMatchClubQuery(matchClubId, {
    clubId,
    enabled: Boolean(matchClubId && clubId),
  });
  const match = matchClubQueryData?.matchClub?.match;
  const { data: membership } = useMembershipInfoQuery(params.clubId ?? "", {
    enabled: Boolean(params.clubId),
  });
  const { data: permissions = [] } = usePlayerPermissionsQuery(membership?.id ?? "", {
    enabled: Boolean(membership?.id),
  });
  const canManage = permissions.includes("MATCH_MANAGE");
  const quarters = data?.quarters ?? [];
  const isRecordLocked = match ? dayjs().isAfter(dayjs(match.stDate).add(5, "day")) : false;
  const canEdit = canManage && !isRecordLocked;

  const [pendingGoals, setPendingGoals] = useState<
    {
      id: string;
      quarterId: string;
      teamId?: string | null;
      name: string;
      imageUrl?: string;
      isOwner?: boolean;
      assistName?: string;
    }[]
  >([]);

  useEffect(() => {
    if (data) {
      setPendingGoals([]);
    }
  }, [data]);

  const handleGoalAdded = (goal: {
    attendanceId: string;
    assistAttendanceId?: string;
    teamId?: string | null;
    quarterId: string;
    isOwnGoal?: boolean;
    scorerName: string;
    scorerImage?: string;
    assistName?: string;
  }) => {
    setPendingGoals((prev) => [
      ...prev,
      {
        id: `pending-${Date.now()}`,
        quarterId: goal.quarterId,
        teamId: goal.teamId,
        name: goal.scorerName,
        imageUrl: goal.scorerImage,
        isOwner: goal.isOwnGoal,
        assistName: goal.assistName,
      },
    ]);
  };

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="pb-12">
        {quarters.map((quarter, index) => {
          const isSameTeam1 = index > 0 ? quarter.team1Id === quarters[index - 1].team1Id : false;
          const isSameTeam2 = index > 0 ? quarter.team2Id === quarters[index - 1].team2Id : false;
          const team1Goals = quarter.records
            .filter((goal) => {
              return goal.teamId === quarter.team1Id || !quarter.team1Id;
            })
            .map((goal) => {
              const name = getAttendanceDisplayName(goal.attendance);
              const imageUrl =
                goal.attendance.player?.user?.userImage?.url ||
                goal.attendance.mercenary?.user?.userImage?.url ||
                "";
              return (
                <GoalComponent
                  key={goal.id}
                  id={goal.id}
                  name={name}
                  imageUrl={imageUrl}
                  isOwner={goal.isOwnGoal}
                  assistName={
                    getAttendanceDisplayName(goal.assistAttendance ?? undefined) || undefined
                  }
                  onRefetch={async () => {
                    await refetch();
                  }}
                  canEdit={canEdit}
                />
              );
            });
          const pendingTeam1Goals = pendingGoals
            .filter((goal) => {
              return (
                goal.quarterId === quarter.id &&
                (goal.teamId === quarter.team1Id || !quarter.team1Id)
              );
            })
            .map((goal) => (
              <GoalComponent
                key={goal.id}
                id={goal.id}
                name={goal.name}
                imageUrl={goal.imageUrl}
                isOwner={goal.isOwner}
                assistName={goal.assistName}
                onRefetch={async () => {}}
                canEdit={false}
                isPending={true}
              />
            ));
          const team1ContentCombined = [...team1Goals, ...pendingTeam1Goals];
          const team2Goals = quarter.records
            .filter((goal) => {
              return goal.teamId === quarter.team2Id;
            })
            .map((goal) => {
              const name = getAttendanceDisplayName(goal.attendance);
              const imageUrl =
                goal.attendance.player?.user?.userImage?.url ||
                goal.attendance.mercenary?.user?.userImage?.url ||
                "";
              return (
                <GoalComponent
                  key={goal.id}
                  id={goal.id}
                  name={name}
                  imageUrl={imageUrl}
                  isOwner={goal.isOwnGoal}
                  assistName={
                    getAttendanceDisplayName(goal.assistAttendance ?? undefined) || undefined
                  }
                  onRefetch={async () => {
                    await refetch();
                  }}
                  canEdit={canEdit}
                />
              );
            });
          const pendingTeam2Goals = pendingGoals
            .filter((goal) => {
              return goal.quarterId === quarter.id && goal.teamId === quarter.team2Id;
            })
            .map((goal) => (
              <GoalComponent
                key={goal.id}
                id={goal.id}
                name={goal.name}
                imageUrl={goal.imageUrl}
                isOwner={goal.isOwner}
                assistName={goal.assistName}
                onRefetch={async () => {}}
                canEdit={false}
                isPending={true}
              />
            ));
          const team2ContentCombined = [...team2Goals, ...pendingTeam2Goals];
          return (
            <QuarterRecord
              key={quarter.id}
              isSelf={quarter.isSelf}
              quarter={quarter}
              end={index === quarters.length - 1}
              isSameTeam1={isSameTeam1}
              isSameTeam2={isSameTeam2}
              team1Content={team1ContentCombined}
              team2Content={team2ContentCombined}
              canEdit={canEdit}
              Dialog={({ quarter: dialogQuarter, team, children }) => (
                <RecordRegister
                  quarter={dialogQuarter}
                  clubId={clubId}
                  team={team ?? undefined}
                  canEdit={canEdit}
                  onGoalAdded={handleGoalAdded}
                >
                  {children}
                </RecordRegister>
              )}
            />
          );
        })}
      </div>
    </>
  );
};

const GoalComponent = ({
  id,
  name,
  imageUrl,
  isOwner,
  assistName,
  onRefetch,
  canEdit,
  isPending,
}: {
  id: string;
  name: string;
  imageUrl?: string;
  isOwner?: boolean;
  assistName?: string;
  onRefetch: () => Promise<void>;
  canEdit: boolean;
  isPending?: boolean;
}) => {
  const [_isPending, startTransition] = useTransition();
  const handleDelGoal = (id: string) => {
    startTransition(async () => {
      await fetch("/api/record", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      await onRefetch();
    });
  };
  return (
    <GoalItem
      id={id}
      name={name}
      imageUrl={imageUrl}
      isOwner={isOwner}
      assistName={assistName}
      onDelete={(goalId) =>
        confirm({
          title: "골기록 삭제",
          description: (
            <>
              <span className="font-semibold">{name}</span>
              님의 골 기록을
              <span className="text-destructive"> 삭제</span>하시겠습니까?
            </>
          ),
          confirmText: "삭제",
        }).onConfirm(() => handleDelGoal(goalId))
      }
      Avatar={Avatar}
      AvatarFallback={AvatarFallback}
      AvatarImage={AvatarImage}
      Loading={Loading}
      FaFutbol={FaFutbol}
      Button={Button}
      canDelete={canEdit && !isPending}
      isPending={isPending}
    />
  );
};

export default RecordPage;
