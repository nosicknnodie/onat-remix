import type { Team } from "@prisma/client";
import { AiFillSkin } from "react-icons/ai";
import { FiEdit } from "react-icons/fi";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type AttendanceRecord, getAttendanceDisplayName } from "~/features/matches/isomorphic";

export type UIAttendance = AttendanceRecord;

export type TeamWithAttendances = Team & { attendances?: (UIAttendance | null)[] };

export function TeamCard({
  team,
  headerAction,
  renderAttendance,
}: {
  team: TeamWithAttendances | null;
  headerAction?: React.ReactNode;
  renderAttendance: (attendance: UIAttendance | null) => React.ReactNode;
}) {
  return (
    <Card style={{ backgroundColor: team?.color ? `${team?.color}0D` : undefined }}>
      <CardHeader>
        <CardTitle className="flex gap-2 justify-between items-center">
          <div className="flex gap-2 items-center">
            <AiFillSkin color={team?.color} className="drop-shadow" />
            <span className="text-lg">{team?.name}</span>
            <span className="text-muted-foreground text-sm">({team?.attendances?.length})</span>
          </div>
          {headerAction ?? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="팀 수정"
              className="bg-transparent shadow-none drop-shadow-none ring-0 focus:ring-0 outline-none"
            >
              <FiEdit />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid xl:grid-cols-4 md:max-xl:grid-cols-3 max-md:grid-cols-2 gap-2">
          {team?.attendances?.map((attendance) => (
            <div key={attendance?.id ?? undefined}>{renderAttendance(attendance ?? null)}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AttendanceLabel({ attendance }: { attendance: UIAttendance }) {
  return (
    <div className="flex items-center gap-1">
      <Avatar className="size-5">
        <AvatarImage
          src={
            attendance.player?.user?.userImage?.url ||
            attendance.mercenary?.user?.userImage?.url ||
            "/images/user_empty.png"
          }
        />
        <AvatarFallback className="bg-primary-foreground">
          <Loading />
        </AvatarFallback>
      </Avatar>
      <span>{getAttendanceDisplayName(attendance)}</span>
    </div>
  );
}
