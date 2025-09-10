import { useLoaderData, useParams } from "@remix-run/react";
import { useTransition } from "react";
import { FaCheck, FaInfoCircle, FaQuestionCircle, FaTimesCircle } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import {
  type AttendanceCheckItem,
  AttendanceGroupCard,
  AttendanceGroupCardContent,
  AttendanceGroupCardHeader,
  AttendanceGroupCardItem,
  AttendanceGroupCardTitle,
  AttendanceManageAction,
  type AttendanceMercenary,
  type AttendancePlayer,
} from "~/features/matches";
import { cn } from "~/libs";
import { action, loader } from "./_data";
import { AttendanceContext, useAttendance } from "./_hook";
export { action, loader };

interface IAttendancePageProps {}

/**
 * @param _props
 * @returns
 */
const AttendancePage = (_props: IAttendancePageProps) => {
  const hooks = useAttendance();
  const {
    isBeforeDay,
    isCheckTimeOpen,
    attend,
    mercenaryAttedances,
    user,
    currentStatus,
    currentChecked,
    fetcher,
    revalidate,
  } = hooks;

  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const [_isPending] = useTransition();

  const statusIcons = {
    ATTEND: <MdEventAvailable className="text-primary" />,
    ABSENT: <FaTimesCircle className="text-destructive" />,
    PENDING: <FaQuestionCircle className="text-muted-foreground" />,
  };

  return (
    <AttendanceContext.Provider value={hooks}>
      <div className="space-y-2">
        <div className="border p-2 rounded-md space-y-2">
          {isBeforeDay && (
            <div className="flex items-center gap-x-1 text-sm overflow-hidden">
              <fetcher.Form method="post">
                <input type="hidden" name="isCheck" value="false" />
                <input type="hidden" name="isVote" value="true" />
                <Button
                  variant="outline"
                  className="flex items-center gap-x-1 w-32"
                  disabled={fetcher.state !== "idle"}
                >
                  {statusIcons.ATTEND} 참석
                  {"ATTEND" === currentStatus && <FaCheck className="text-primary" />}
                </Button>
              </fetcher.Form>
              <fetcher.Form method="post">
                <input type="hidden" name="isCheck" value="false" />
                <input type="hidden" name="isVote" value="false" />
                <Button
                  variant="outline"
                  className="flex items-center gap-x-1 w-32"
                  disabled={fetcher.state !== "idle"}
                >
                  {statusIcons.ABSENT} 불참
                  {"ABSENT" === currentStatus && <FaCheck className="text-primary" />}
                </Button>
              </fetcher.Form>
            </div>
          )}
          <div className="flex justify-between">
            <div className={cn("flex items-center gap-x-2 text-sm px-2")}>
              <FaInfoCircle className="text-muted-foreground" /> 현재 상태:{" "}
              <span
                className={cn("flex items-center gap-x-1", {
                  "text-primary": currentStatus === "ATTEND",
                  "text-destructive": currentStatus === "ABSENT",
                  "text-muted-foreground": currentStatus === "PENDING",
                })}
              >
                {statusIcons[currentStatus as "ATTEND" | "ABSENT" | "PENDING"]}
                {{ ATTEND: "참석", ABSENT: "불참", PENDING: "선택안함" }[currentStatus]}
              </span>
              {fetcher.state !== "idle" && <Loading size={16} />}
            </div>
            {isCheckTimeOpen && currentStatus === "ATTEND" && (
              <fetcher.Form method="post">
                <input type="hidden" name="isCheck" value="true" />
                <input type="hidden" name="isVote" value="true" />
                <Button
                  disabled={fetcher.state !== "idle" || currentChecked === "CHECKED"}
                  className={cn({ "bg-green-500": currentChecked === "CHECKED" })}
                >
                  {currentChecked === "CHECKED" ? "출석완" : "출석체크"}
                </Button>
              </fetcher.Form>
            )}
            <div>
              <AttendanceManageAction
                players={(() => {
                  const attendedIds = loaderData.matchClub.attendances
                    .filter((att) => att.playerId && att.isVote)
                    .map((att) => att.playerId!);
                  const players: AttendancePlayer[] = loaderData.matchClub.club.players.map(
                    (p) => ({
                      id: p.id,
                      user: p.user,
                      isAttended: attendedIds.includes(p.id),
                    }),
                  );
                  return players;
                })()}
                onTogglePlayer={async (playerId, isVote) => {
                  const res = await fetch("/api/attendances/player", {
                    method: "POST",
                    body: JSON.stringify({ matchClubId: params.matchClubId, playerId, isVote }),
                  }).then((r) => r.json());
                  if (res.success) {
                    revalidate();
                    return true;
                  }
                  return false;
                }}
                mercenaries={(() => {
                  const attendedIds = loaderData.matchClub.attendances
                    .filter((att) => att.mercenaryId && att.isVote)
                    .map((att) => att.mercenaryId!);
                  const mercenaries: AttendanceMercenary[] =
                    loaderData.matchClub.club.mercenarys.map((m) => ({
                      id: m.id,
                      name: m.name,
                      hp: m.hp,
                      user: m.user,
                      isAttended: attendedIds.includes(m.id),
                    }));
                  return mercenaries;
                })()}
                onToggleMercenary={async (mercenaryId, isVote) => {
                  const res = await fetch("/api/attendances/mercenary", {
                    method: "POST",
                    body: JSON.stringify({ matchClubId: params.matchClubId, mercenaryId, isVote }),
                  }).then((r) => r.json());
                  if (res.success) {
                    revalidate();
                    return true;
                  }
                  return false;
                }}
                attendances={(() => {
                  const attendeds = loaderData.matchClub.attendances.filter((att) => att.isVote);
                  const arr: AttendanceCheckItem[] = attendeds.map((a) => ({
                    id: a.id,
                    name:
                      a.player?.user?.name || a.mercenary?.user?.name || a.mercenary?.name || "",
                    imageUrl:
                      a.player?.user?.userImage?.url ||
                      a.mercenary?.user?.userImage?.url ||
                      undefined,
                    isCheck: a.isCheck,
                  }));
                  return arr;
                })()}
                onToggleCheck={async (attendanceId, isCheck) => {
                  const res = await fetch("/api/attendances", {
                    method: "POST",
                    body: JSON.stringify({ id: attendanceId, isCheck }),
                  }).then((r) => r.json());
                  if (res.success) {
                    revalidate();
                    return true;
                  }
                  return false;
                }}
                mercenariesHref={"../mercenaries"}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <AttendanceGroupCard className="bg-primary/5">
            <AttendanceGroupCardHeader>
              <AttendanceGroupCardTitle>
                {statusIcons.ATTEND} 참석: {attend.ATTEND.length + mercenaryAttedances.length}
                {mercenaryAttedances.length > 0 &&
                  `(${attend.ATTEND.length}+${mercenaryAttedances.length})`}
                {"ATTEND" === currentStatus && <FaCheck className="text-primary" />}
              </AttendanceGroupCardTitle>
              {/* 관리 액션은 상단 상태 영역에서 제공 */}
            </AttendanceGroupCardHeader>
            <AttendanceGroupCardContent>
              {attend.ATTEND.map((u) => (
                <AttendanceGroupCardItem
                  key={u.id}
                  className={cn({
                    "border-primary font-semibold text-primary": user?.id === u.player?.user?.id,
                  })}
                  isChecked={u.isCheck}
                >
                  {u.player?.user?.name}
                </AttendanceGroupCardItem>
              ))}
              {mercenaryAttedances.map((ma) => (
                <AttendanceGroupCardItem
                  key={ma.id}
                  className={cn({
                    "border-primary font-semibold text-primary": user?.id === ma.mercenary!.userId,
                  })}
                  isChecked={ma.isCheck}
                >
                  {ma.mercenary!.user?.name ?? ma.mercenary!.name}
                </AttendanceGroupCardItem>
              ))}
            </AttendanceGroupCardContent>
          </AttendanceGroupCard>

          <AttendanceGroupCard className="bg-destructive/5">
            <AttendanceGroupCardHeader>
              <AttendanceGroupCardTitle>
                {statusIcons.ABSENT} 불참: {attend.ABSENT.length}
                {"ABSENT" === currentStatus && <FaCheck className="text-primary" />}
              </AttendanceGroupCardTitle>
            </AttendanceGroupCardHeader>
            <AttendanceGroupCardContent>
              {attend.ABSENT.map((u) => (
                <AttendanceGroupCardItem
                  key={u.id}
                  className={cn({
                    "border-primary font-semibold text-primary": user?.id === u.player?.user?.id,
                  })}
                >
                  {u.player?.user?.name}
                </AttendanceGroupCardItem>
              ))}
            </AttendanceGroupCardContent>
          </AttendanceGroupCard>

          <AttendanceGroupCard className="bg-muted-foreground/5">
            <AttendanceGroupCardHeader>
              <AttendanceGroupCardTitle>
                {statusIcons.PENDING} 선택안함: {attend.PENDING.length}
                {"PENDING" === currentStatus && <FaCheck className="text-primary" />}
              </AttendanceGroupCardTitle>
            </AttendanceGroupCardHeader>
            <AttendanceGroupCardContent>
              {attend.PENDING.map((u) => (
                <AttendanceGroupCardItem
                  key={u.id}
                  className={cn({
                    "border-primary font-semibold text-primary": user?.id === u.user?.id,
                  })}
                >
                  {u.user?.name}
                </AttendanceGroupCardItem>
              ))}
            </AttendanceGroupCardContent>
          </AttendanceGroupCard>
        </div>
      </div>
    </AttendanceContext.Provider>
  );
};

export default AttendancePage;
