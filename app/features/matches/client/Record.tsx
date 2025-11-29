import type { Team } from "@prisma/client";
import type React from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/isomorphic";

export function QuarterRecord({
  quarter,
  end,
  isSameTeam1,
  isSameTeam2,
  team1Content,
  team2Content,
  Dialog,
  isSelf,
  canEdit,
}: {
  end?: boolean;
  isSameTeam1?: boolean;
  isSameTeam2?: boolean;
  team1Content?: React.ReactNode;
  team2Content?: React.ReactNode;
  quarter: {
    id: string;
    order: number;
    matchClubId: string;
    isSelf?: boolean | null;
    team1?: Team | null;
    team2?: Team | null;
  };
  Dialog: (props: {
    quarter: {
      id: string;
      order: number;
      matchClubId: string;
      isSelf?: boolean | null;
      team1?: Team | null;
      team2?: Team | null;
    };
    team?: Team | null;
    children: React.ReactNode;
  }) => React.ReactElement;
  isSelf?: boolean;
  canEdit?: boolean;
}) {
  return (
    <div className="flex justify-between relative w-full">
      <div
        className={cn(
          "absolute z-20 -translate-x-1/2 top-4 -translate-y-1/2 text-white font-semibold h-8 text-xs flex items-center justify-center gap-2",
          { "left-1/3": !isSelf, "left-1/2": isSelf },
        )}
      >
        {canEdit && (
          <>
            {isSelf ? (
              <Dialog quarter={quarter} team={quarter.team1}>
                <Button
                  variant="ghost"
                  className={`bg-primary rounded-l-full w-12 translate-x-4`}
                  size="sm"
                  disabled={isSelf && !quarter.team1}
                >
                  +
                </Button>
              </Dialog>
            ) : (
              <div className="w-12"></div>
            )}
          </>
        )}
        <div className="rounded-full z-20 bg-white w-10 h-10 flex justify-center items-center">
          <div className="bg-primary w-8 h-8 flex items-center justify-center rounded-full">
            {quarter.order}
          </div>
        </div>

        {canEdit && (
          <Dialog quarter={quarter} team={quarter.team2}>
            <Button
              variant="ghost"
              className="bg-primary rounded-r-full w-12 -translate-x-4"
              size="sm"
              disabled={isSelf && !quarter.team2}
            >
              +
            </Button>
          </Dialog>
        )}
      </div>
      {!isSameTeam1 && (
        <div className="absolute top-4 left-1/2 -translate-x-full -translate-y-1/2 flex items-center justify-center pr-16 font-semibold drop-shadow-sm">
          {quarter.team1?.name}
        </div>
      )}
      {!isSameTeam2 && (
        <div className="absolute top-4 left-1/2 translate-x-0 -translate-y-1/2 flex items-center justify-center pl-16 font-semibold drop-shadow-sm">
          {quarter.team2?.name}
        </div>
      )}
      <div
        className={cn(
          "absolute top-10  -translate-x-1/2 bg-secondary w-1 h-[calc(100%-3rem)] rounded-md",
          { "left-1/3": !isSelf, "left-1/2": isSelf },
        )}
      ></div>
      {isSelf ? (
        <>
          <div className="mt-10 w-1/2 flex flex-col items-end pb-2 pr-8 text-sm min-h-16">
            {team1Content}
          </div>
          <div className="mt-10 w-1/2 flex flex-col items-start pb-2 text-sm pl-8 min-h-16">
            {team2Content}
          </div>
        </>
      ) : (
        <>
          <div className="mt-10 w-full flex flex-col items-start pb-2 px-2 translate-x-1/3 text-sm min-h-16">
            {team1Content}
          </div>
        </>
      )}
      {end && (
        <div
          className={cn(
            "absolute bottom-0 left-1/2 translate-y-full -translate-x-1/2 bg-secondary text-white font-semibold rounded-full w-8 h-8 text-xs flex items-center justify-center",
            { "left-1/3": !isSelf },
          )}
        >
          종료
        </div>
      )}
    </div>
  );
}

export function GoalItem({
  id,
  name,
  imageUrl,
  isOwner,
  assistName,
  onDelete,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Loading,
  FaFutbol,
  Button,
  canDelete = true,
  isPending,
}: {
  id: string;
  name: string;
  imageUrl?: string;
  isOwner?: boolean;
  assistName?: string;
  onDelete: (id: string) => void;
  // pass-through components to avoid deep coupling
  Avatar: React.ComponentType<{ className?: string; children?: React.ReactNode }>;
  AvatarFallback: React.ComponentType<{ children?: React.ReactNode; className?: string }>;
  AvatarImage: React.ComponentType<{ src?: string }>;
  Loading: React.ComponentType<{ className?: string }>;
  FaFutbol: React.ComponentType<{ className?: string }>;
  Button: React.ComponentType<Record<string, unknown>>;
  canDelete?: boolean;
  isPending?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-4">
        <AvatarImage src={imageUrl || "/images/user_empty.png"} />
        <AvatarFallback className="bg-primary-foreground">
          <Loading className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <span className="flex items-center gap-1">
        <span className="font-medium">{name}</span>
        {assistName && <span className="text-xs text-muted-foreground">(A. {assistName})</span>}
        <FaFutbol className={`text-primary ${isOwner ? "text-destructive" : ""}`} />
        {isOwner && <span className="text-xs text-destructive">자책</span>}
      </span>
      {canDelete && (
        <Button
          variant="ghost"
          size={"icon"}
          className="w-3 h-3 text-destructive"
          onClick={() => onDelete(id)}
        >
          x
        </Button>
      )}
      {isPending && <Loading className="w-3 h-3" />}
    </div>
  );
}
