import type React from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function RatingCard({
  name,
  imageUrl,
  isPlayer,
  isPerception,
  hasGoal,
  isActive,
  quartersCount,
  playedCount,
  quarters,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Loading,

  isAttackPosition,
  isMiddlePosition,
  isDefensePosition,
  // RightDrawer (unused now, replaced by rightDrawerTrigger)
  rightDrawerTrigger,
  attendance,
  onScoreChange,
  score,
  StarRating,
  liked,
  onToggleLike,
  LikeIcon,
  UnlikeIcon,
}: {
  name: string;
  imageUrl: string;
  isPlayer: boolean;
  isPerception: boolean;
  hasGoal: boolean;
  isActive: boolean;
  quartersCount: number;
  playedCount: number;
  quarters: Array<{ id: string }>;
  Avatar: React.ComponentType<{ className?: string; children?: React.ReactNode }>;
  AvatarImage: React.ComponentType<{ src?: string }>;
  AvatarFallback: React.ComponentType<{ children?: React.ReactNode }>;
  Loading: React.ComponentType<{ className?: string }>;
  isAttackPosition: (p: string) => boolean;
  isMiddlePosition: (p: string) => boolean;
  isDefensePosition: (p: string) => boolean;
  rightDrawerTrigger?: React.ReactNode;
  attendance: {
    id: string;
    assigneds: Array<{ quarterId: string; position?: string; goals?: unknown[] }>;
  };
  onScoreChange: (score: number) => void;
  score: number;
  StarRating: React.ComponentType<{
    id: string;
    score: number;
    width: number;
    isHighLight?: boolean;
    disabled?: boolean;
    onClick: (e: unknown, s: number) => void;
  }>;
  liked: boolean;
  onToggleLike: () => void;
  LikeIcon: React.ComponentType<{ size?: number; className?: string }>;
  UnlikeIcon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Card
      className={"w-full h-full transition-all duration-300 bg-zinc-100 rounded-xl flex flex-col"}
    >
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex justify-between items-center">
          <span>
            {name}
            {`'s 정보`}
          </span>
          {rightDrawerTrigger}
        </CardTitle>
        <div className="flex gap-x-2">
          <Badge variant={isPlayer ? "default" : "outline"}>{isPlayer ? "회원" : "용병"}</Badge>
          {hasGoal && <Badge variant="secondary">득점</Badge>}
          {isPerception && <Badge variant={"destructive"}>지각</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-y-2 justify-between">
        <div>
          <div className="flex justify-center items-center flex-col">
            <Avatar className="md:size-24 max-md:size-16">
              <AvatarImage src={imageUrl} />
              <AvatarFallback>
                <Loading />
              </AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold">{name}</span>
          </div>
          <div className="text-sm font-semibold">경기횟수</div>
          <div className="flex gap-1 w-full items-center">
            <span className="rounded flex-1 text-xs text-center">
              ({playedCount}/{quartersCount})
            </span>
            {quarters.map((quarter) => {
              const position = attendance.assigneds.find((as) => as.quarterId === quarter.id)
                ?.position as string | undefined;
              return (
                <span
                  key={quarter.id}
                  className={`h-2 rounded flex-1 border ${
                    position
                      ? isAttackPosition(position)
                        ? "bg-red-500"
                        : isMiddlePosition(position)
                          ? "bg-yellow-400"
                          : isDefensePosition(position)
                            ? "bg-blue-500"
                            : position === "GK"
                              ? "bg-green-500"
                              : "bg-gray-200"
                      : "bg-gray-200"
                  }`}
                ></span>
              );
            })}
          </div>
        </div>
        <div className="flex-1 flex justify-between items-center">
          <StarRating
            id={`${attendance.id}-star-id`}
            score={score}
            width={30}
            isHighLight
            disabled={!isActive}
            onClick={(_e, s) => onScoreChange(s)}
          />
          <div>
            <Button size="icon" variant={"ghost"} disabled={!isActive} onClick={onToggleLike}>
              {liked ? (
                <LikeIcon size={30} className="text-primary" />
              ) : (
                <UnlikeIcon size={30} className="text-muted" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
