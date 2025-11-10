//
import { AvatarFallback } from "@radix-ui/react-avatar";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useTransition } from "react";
import { FaFutbol } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { confirm } from "~/components/ui/confirm";
import { GoalItem, QuarterRecord, RecordRightDrawer } from "~/features/matches/client";
import { recordService } from "~/features/matches/server";
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId!;
  const data = await recordService.getRecordPageData(matchClubId);
  return data;
};

interface IRecordPageProps {}

const RecordPage = (_props: IRecordPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const quarters = loaderData.quarters;
  return (
    <>
      <div className="pb-12">
        {quarters.map((quarter, index) => {
          const isSameTeam1 = index > 0 ? quarter.team1Id === quarters[index - 1].team1Id : false;
          const isSameTeam2 = index > 0 ? quarter.team2Id === quarters[index - 1].team2Id : false;
          const team1Goals = quarter.goals
            .filter((goal) => {
              return goal.teamId === quarter.team1Id || !quarter.team1Id;
            })
            .map((goal) => {
              const name =
                goal.assigned.attendance.player?.user?.name ||
                goal.assigned.attendance.mercenary?.user?.name ||
                goal.assigned.attendance.mercenary?.name ||
                "";
              const imageUrl =
                goal.assigned.attendance.player?.user?.userImage?.url ||
                goal.assigned.attendance.mercenary?.user?.userImage?.url ||
                "";
              return (
                <GoalComponent
                  key={goal.id}
                  id={goal.id}
                  name={name}
                  imageUrl={imageUrl}
                  isOwner={goal.isOwnGoal}
                />
              );
            });
          const team2Goals = quarter.goals
            .filter((goal) => {
              return goal.teamId === quarter.team2Id;
            })
            .map((goal) => {
              const name =
                goal.assigned.attendance.player?.user?.name ||
                goal.assigned.attendance.mercenary?.user?.name ||
                goal.assigned.attendance.mercenary?.name ||
                "";
              const imageUrl =
                goal.assigned.attendance.player?.user?.userImage?.url ||
                goal.assigned.attendance.mercenary?.user?.userImage?.url ||
                "";
              return (
                <GoalComponent
                  key={goal.id}
                  id={goal.id}
                  name={name}
                  imageUrl={imageUrl}
                  isOwner={goal.isOwnGoal}
                />
              );
            });
          return (
            <QuarterRecord
              key={quarter.id}
              quarter={quarter}
              end={index === quarters.length - 1}
              isSameTeam1={isSameTeam1}
              isSameTeam2={isSameTeam2}
              team1Content={team1Goals}
              team2Content={team2Goals}
              RightDrawer={({ quarterId, children }) => (
                <RecordRightDrawer
                  quarterId={quarterId}
                  quarters={quarters}
                  onRefetch={() => {
                    revalidate();
                  }}
                >
                  {children}
                </RecordRightDrawer>
              )}
            />
          );
        })}
      </div>
    </>
  );
};

// UI로 이전됨 (features/matches/ui/Record)

const GoalComponent = ({
  id,
  name,
  imageUrl,
  isOwner,
}: {
  id: string;
  name: string;
  imageUrl?: string;
  isOwner?: boolean;
}) => {
  const [_isPending, startTransition] = useTransition();
  const { revalidate } = useRevalidator();
  const handleDelGoal = (id: string) => {
    startTransition(async () => {
      await fetch("/api/goal", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      revalidate();
    });
  };
  return (
    <GoalItem
      id={id}
      name={name}
      imageUrl={imageUrl}
      isOwner={isOwner}
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
