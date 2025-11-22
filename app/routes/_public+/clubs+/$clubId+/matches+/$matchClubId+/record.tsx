//
import { AvatarFallback } from "@radix-ui/react-avatar";
import { useParams } from "@remix-run/react";
import { useTransition } from "react";
import { FaFutbol } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { confirm } from "~/components/ui/confirm";
import { useMembershipInfoQuery, usePlayerPermissionsQuery } from "~/features/clubs/isomorphic";
import { GoalItem, QuarterRecord, RecordRegister } from "~/features/matches/client";
import { getAttendanceDisplayName, useRecordQuery } from "~/features/matches/isomorphic";

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
  const { data: membership } = useMembershipInfoQuery(params.clubId ?? "", {
    enabled: Boolean(params.clubId),
  });
  const { data: permissions = [] } = usePlayerPermissionsQuery(membership?.id ?? "", {
    enabled: Boolean(membership?.id),
  });
  const canManage = permissions.includes("MATCH_MANAGE");
  const quarters = data?.quarters ?? [];

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
                />
              );
            });
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
                />
              );
            });
          return (
            <QuarterRecord
              key={quarter.id}
              isSelf={quarter.isSelf}
              quarter={quarter}
              end={index === quarters.length - 1}
              isSameTeam1={isSameTeam1}
              isSameTeam2={isSameTeam2}
              team1Content={team1Goals}
              team2Content={team2Goals}
              canEdit={canManage}
              Dialog={({ quarter: dialogQuarter, team, children }) => (
                <RecordRegister
                  quarter={dialogQuarter}
                  clubId={clubId}
                  team={team ?? undefined}
                  canEdit={canManage}
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
}: {
  id: string;
  name: string;
  imageUrl?: string;
  isOwner?: boolean;
  assistName?: string;
  onRefetch: () => Promise<void>;
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
    />
  );
};

export default RecordPage;
