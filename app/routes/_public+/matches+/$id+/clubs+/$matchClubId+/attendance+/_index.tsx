import { FaCheck, FaInfoCircle, FaQuestionCircle, FaTimesCircle } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import AttendanceManageAction from "./_components/AttendanceManageAction";
import {
  AttendanceGroupCard,
  AttendanceGroupCardContent,
  AttendanceGroupCardHeader,
  AttendanceGroupCardItem,
  AttendanceGroupCardTitle,
} from "./_components/_index";
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
  } = hooks;

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
              <AttendanceManageAction />
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
