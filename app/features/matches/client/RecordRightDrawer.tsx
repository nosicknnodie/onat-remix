import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useTransition } from "react";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";

interface TeamShape {
  id: string;
  name: string;
}
interface QuarterShape {
  id: string;
  order: number;
  team1?: TeamShape | null;
  team2?: TeamShape | null;
}

interface RightDrawerProps extends React.PropsWithChildren {
  quarterId?: string;
  quarters: QuarterShape[];
  onRefetch: () => void | Promise<void>;
}

export const RecordRightDrawer = ({
  children,
  quarterId,
  quarters,
  onRefetch,
}: RightDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentTeam, setCurrentTeam] = useState<TeamShape | null>(null);
  const currentQuarter = quarters.find((q) => q.id === quarterId);
  const { data } = useQuery({
    queryKey: ["RECORD_QUARTER_ASSIGNED_QUERY", quarterId],
    queryFn: async () => await fetch(`/api/quarters/${quarterId}`).then((res) => res.json()),
  });

  const quater:
    | {
        assigneds: {
          id: string;
          teamId: string | null;
          attendance: {
            id: string;
            player?: {
              user?: { name?: string | null; userImage?: { url?: string | null } | null } | null;
            } | null;
            mercenary?: {
              user?: { name?: string | null; userImage?: { url?: string | null } | null } | null;
              name?: string | null;
            } | null;
          };
        }[];
      }
    | undefined = data?.quarter;
  const assigneds =
    quater?.assigneds.sort((a, b) =>
      a.teamId === b.teamId ? 0 : a.teamId === currentTeam?.id ? -1 : 1,
    ) ?? [];

  useEffect(() => {
    if (currentQuarter?.team1) setCurrentTeam(currentQuarter.team1);
  }, [currentQuarter]);

  const handleOnTeamChange = (team: TeamShape | null) => setCurrentTeam(team);
  const handleAddGoal = async (goal: {
    assignedId: string;
    teamId?: string | null;
    quarterId?: string;
    isOwnGoal?: boolean;
  }) => {
    startTransition(async () => {
      const res = await fetch("/api/goal", { method: "POST", body: JSON.stringify(goal) });
      if (res.status === 200) {
        await onRefetch();
        setOpen(false);
      }
    });
  };

  return (
    <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="min-h-[50%] max-h-[70%] p-2">
        <DrawerHeader>
          <div className="text-lg font-bold mb-4 pb-2 border-b flex justify-between">
            <DrawerTitle className="flex-1 flex justify-center items-center">
              {currentQuarter?.order} 쿼터
            </DrawerTitle>
            {currentTeam && (
              <div className="flex flex-1 gap-2 justify-center items-center">
                <Button
                  size={"sm"}
                  variant={currentTeam?.id === currentQuarter?.team1?.id ? "default" : "outline"}
                  onClick={() => handleOnTeamChange(currentQuarter?.team1 ?? null)}
                >
                  {currentQuarter?.team1?.name}
                </Button>
                <Button
                  size={"sm"}
                  variant={currentTeam?.id === currentQuarter?.team2?.id ? "default" : "outline"}
                  onClick={() => handleOnTeamChange(currentQuarter?.team2 ?? null)}
                >
                  {currentQuarter?.team2?.name}
                </Button>
              </div>
            )}
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto">
          <ul className="space-y-2">
            {assigneds.map((assigned) => {
              const name =
                assigned.attendance.player?.user?.name ||
                assigned.attendance.mercenary?.user?.name ||
                assigned.attendance.mercenary?.name ||
                "";
              const imageUrl =
                assigned.attendance.player?.user?.userImage?.url ||
                assigned.attendance.mercenary?.user?.userImage?.url ||
                "/images/user_empty.png";
              return (
                <li key={assigned.id} className="flex justify-between border-b">
                  <div className="flex items-center gap-2 ">
                    <Avatar>
                      <AvatarImage src={imageUrl}></AvatarImage>
                      <AvatarFallback>
                        <Loading />
                      </AvatarFallback>
                    </Avatar>
                    <span>{name}</span>
                  </div>
                  <div className="px-4">
                    <Button
                      variant={currentTeam?.id === assigned.teamId ? "default" : "destructive"}
                      disabled={isPending}
                      onClick={() =>
                        handleAddGoal({
                          assignedId: assigned.id,
                          teamId: currentTeam?.id,
                          quarterId: quarterId,
                          isOwnGoal: assigned.teamId ? currentTeam?.id !== assigned.teamId : false,
                        })
                      }
                    >
                      + {currentTeam?.id === assigned.teamId ? "골" : "자책골"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
