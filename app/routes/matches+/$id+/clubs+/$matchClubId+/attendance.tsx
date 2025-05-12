import { File, User } from "@prisma/client";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect } from "react";
import {
  FaCheck,
  FaCheckCircle,
  FaInfoCircle,
  FaQuestionCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { useSession } from "~/contexts/AuthUserContext";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const matchClubId = params.matchClubId;
  const matchClub = await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    include: {
      match: true,
      club: {
        include: {
          image: true,
          emblem: true,
          mercenarys: { include: { user: { include: { userImage: true } } } },
          players: {
            where: { status: "APPROVED" },
            include: { user: { include: { userImage: true } } },
          },
        },
      },
      attendances: {
        include: {
          player: { include: { user: { include: { userImage: true } } } },
          mercenary: { include: { user: { include: { userImage: true } } } },
        },
      },
      teams: true,
    },
  });

  if (!matchClub) return redirect("/matches/" + matchClubId);

  const [currentPlayer, currentMercenary] = await Promise.all([
    prisma.player.findFirst({
      where: {
        userId: user?.id,
        clubId: matchClub?.clubId,
      },
      include: {
        attendances: { where: { matchClubId: matchClubId } },
        user: {
          include: {
            userImage: true,
          },
        },
      },
    }),
    prisma.mercenary.findFirst({
      where: {
        userId: user?.id,
        clubId: matchClub?.clubId,
        attendances: {
          some: {
            matchClubId: matchClubId,
          },
        },
      },
      include: {
        attendances: true,
        user: {
          include: {
            userImage: true,
          },
        },
      },
    }),
  ]);

  if (!currentPlayer && !currentMercenary) {
    return redirect("/matches/" + matchClubId);
  }

  const currentStatus = currentPlayer
    ? currentPlayer.attendances?.at(0)
      ? currentPlayer.attendances?.at(0)?.isVote
        ? "ATTEND"
        : "ABSENT"
      : "PENDING"
    : currentMercenary?.attendances?.at(0)?.isVote
      ? "ATTEND"
      : "ABSENT";

  const currentChecked = currentPlayer
    ? currentPlayer.attendances?.at(0)
      ? currentPlayer.attendances?.at(0)?.isCheck
        ? "CHECKED"
        : "NOT_CHECKED"
      : "PENDING"
    : currentMercenary?.attendances?.at(0)?.isCheck
      ? "CHECKED"
      : "NOT_CHECKED";

  return { matchClub, currentStatus, currentChecked };
};

export const action = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const matchId = params.id;
  const matchClubId = params.matchClubId;
  const formData = await request.formData();
  const isVote = formData.get("isVote") === "true";
  const isCheck = formData.get("isCheck") === "true";
  if (!matchClubId) return redirect("/matches/" + matchId + "/clubs/" + matchClubId);

  const currentMatchClub = await prisma.matchClub.findUnique({
    where: {
      id: matchClubId,
    },
  });

  const currentPlayer = await prisma.player.findUnique({
    where: {
      clubId_userId: {
        userId: user.id,
        clubId: currentMatchClub?.clubId ?? "",
      },
    },
  });
  if (!currentPlayer) return redirect("/matches/" + matchId + "/clubs/" + matchClubId);

  await prisma.attendance.upsert({
    create: {
      matchClubId,
      playerId: currentPlayer.id,
      isVote,
      isCheck,
    },
    update: {
      isVote,
      isCheck,
    },
    where: {
      matchClubId_playerId: {
        matchClubId,
        playerId: currentPlayer.id,
      },
    },
  });
  return { success: true };
};

interface IAttendancePageProps {}

/**
 * @param _props
 * @returns
 */
const AttendancePage = (_props: IAttendancePageProps) => {
  const user = useSession();
  const { revalidate } = useRevalidator();
  const { matchClub, currentStatus, currentChecked } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const matchDate = new Date(matchClub.match.stDate); // 매치 시간
  const now = new Date();
  // 참석/불참 가능 여부
  const isBeforeDay = now < dayjs(matchDate).subtract(1, "day").toDate();
  // 출석 가능 여부 (2시간 전부터)
  const isCheckTimeOpen = now > dayjs(matchDate).subtract(2, "hour").toDate();

  const attendedUserIds = new Set<string>();
  const grouped: Record<
    "ATTEND" | "ABSENT" | "PENDING",
    (User & { userImage?: File | null; isChecked?: boolean })[]
  > = {
    ATTEND: [],
    ABSENT: [],
    PENDING: [],
  };

  matchClub.attendances.forEach((a) => {
    const user = a.player?.user;
    if (!user) return;
    attendedUserIds.add(user.id);
    grouped[a.isVote ? "ATTEND" : "ABSENT"].push({ ...user, isChecked: a.isCheck });
  });

  matchClub.club.players.forEach((p) => {
    if (p.userId && p.user) {
      if (attendedUserIds.has(p.userId)) return;
      grouped.PENDING.push(p.user);
    }
  });

  const mercenaryAttedances = matchClub.attendances.filter((a) => !!a.mercenary);

  const statusIcons = {
    ATTEND: <MdEventAvailable className="text-primary" />,
    ABSENT: <FaTimesCircle className="text-destructive" />,
    PENDING: <FaQuestionCircle className="text-muted-foreground" />,
  };

  const handleStatusChange = (isVote: boolean, isCheck: boolean) => {
    if (!isVote && isCheck) return;
    fetcher.submit(
      { isVote, isCheck },
      {
        method: "post",
        action: `/matches/${matchClub.matchId}/clubs/${matchClub.id}/attendance`,
      },
    );
  };
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data != null) {
      revalidate();
    }
  }, [fetcher.state, fetcher.data, revalidate]);

  return (
    <div className="space-y-2">
      <div className="border p-2 rounded-md space-y-2">
        {isBeforeDay && (
          <div className="flex items-center gap-x-1 text-sm overflow-hidden">
            <Button
              onClick={() => handleStatusChange(true, false)}
              variant="outline"
              className="flex items-center gap-x-1 w-32"
              disabled={fetcher.state !== "idle"}
            >
              {statusIcons.ATTEND} 참석
              {"ATTEND" === currentStatus && <FaCheck className="text-primary" />}
            </Button>
            <Button
              onClick={() => handleStatusChange(false, false)}
              variant="outline"
              className="flex items-center gap-x-1 w-32"
              disabled={fetcher.state !== "idle"}
            >
              {statusIcons.ABSENT} 불참
              {"ABSENT" === currentStatus && <FaCheck className="text-primary" />}
            </Button>
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
            {fetcher.state === "loading" && <Loading size={16} />}
          </div>

          {isCheckTimeOpen && currentStatus === "ATTEND" && (
            <Button
              onClick={() => handleStatusChange(true, true)}
              disabled={fetcher.state !== "idle" || currentChecked === "CHECKED"}
              className={cn({ "bg-green-500": currentChecked === "CHECKED" })}
            >
              {currentChecked === "CHECKED" ? "출석완" : "출석체크"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {(["ATTEND", "ABSENT", "PENDING"] as const).map((key) => (
          <div
            key={key}
            className={cn("p-4 rounded-lg shadow-sm bg-white hover:shadow-md", {
              "bg-primary/5": key === "ATTEND",
              "bg-destructive/5": key === "ABSENT",
              "bg-muted-foreground/5": key === "PENDING",
            })}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn("font-semibold text-sm flex items-center gap-1")}>
                {statusIcons[key]}{" "}
                {key === "ATTEND" ? "참석" : key === "ABSENT" ? "불참" : "선택안함"}:{" "}
                {grouped[key].length}
                {mercenaryAttedances.length > 0 && `(+${mercenaryAttedances.length})`}
                {key === currentStatus && <FaCheck className="text-primary" />}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {grouped[key].map((u) => (
                <div
                  key={u.id}
                  className={cn("text-sm border px-3 py-1 rounded-full bg-white relative", {
                    "border-primary font-semibold text-primary": user?.id === u.id,
                  })}
                >
                  {u.isChecked && (
                    <FaCheckCircle className="text-green-500 text-sm ml-1 absolute -top-1 -right-1 bg-white" />
                  )}
                  {u.name}
                </div>
              ))}
              {key === "ATTEND" &&
                mercenaryAttedances.length > 0 &&
                mercenaryAttedances.map((ma) => (
                  <div
                    key={ma.id}
                    className={cn("text-sm border px-3 py-1 rounded-full relative", {
                      "border-primary font-semibold text-primary":
                        user?.id === ma.mercenary!.userId,
                    })}
                  >
                    {ma.isCheck && (
                      <FaCheckCircle className="text-green-500 text-sm ml-1 absolute -top-1 -right-1 bg-white" />
                    )}
                    {ma.mercenary!.name ?? ma.mercenary!.name}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* <div className="mt-6 space-x-2">
        <span className="font-bold">참석 여부 선택:</span>
        <Button
          onClick={() => handleStatusChange("ATTEND")}
          className="px-3 py-1 border rounded hover:bg-green-100 flex items-center gap-1"
        >
          <FaCheckCircle className="text-green-500" /> 참석
        </Button>
        <Button
          onClick={() => handleStatusChange("ABSENT")}
          className="px-3 py-1 border rounded hover:bg-red-100 flex items-center gap-1"
        >
          <FaTimesCircle className="text-red-500" /> 불참
        </Button>
        <Button
          onClick={() => handleStatusChange("PENDING")}
          className="px-3 py-1 border rounded hover:bg-yellow-100 flex items-center gap-1"
        >
          <FaQuestionCircle className="text-yellow-500" /> 미정
        </Button>
      </div> */}
    </div>
  );
};

export default AttendancePage;
