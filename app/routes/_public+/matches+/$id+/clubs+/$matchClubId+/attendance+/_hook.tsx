import { useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";
import dayjs from "dayjs";
import { createContext, useContext, useEffect } from "react";
import { useSession } from "~/contexts/AuthUserContext";
import { loader } from "./_data";

export const AttendanceContext = createContext({} as ReturnType<typeof useAttendance>);

export const useAttendanceContext = () => useContext(AttendanceContext);

export const useAttendance = () => {
  const { revalidate } = useRevalidator();
  const fetcher = useFetcher();
  const user = useSession();
  const { matchClub, currentStatus, currentChecked } = useLoaderData<typeof loader>();

  const matchDate = new Date(matchClub.match.stDate); // 매치 시간
  const now = new Date();
  // 참석/불참 가능 여부
  const isBeforeDay = now < dayjs(matchDate).subtract(1, "day").toDate();
  // 출석 가능 여부 (2시간 전부터)
  const isCheckTimeOpen = now > dayjs(matchDate).subtract(2, "hour").toDate();

  const attend = {
    ATTEND: matchClub.attendances.filter((a) => !!a.player && a.isVote),
    ABSENT: matchClub.attendances.filter((a) => !!a.player && !a.isVote),
    PENDING: matchClub.club.players.filter(
      (p) => p.userId && !matchClub.attendances.some((a) => a.player?.userId === p.userId),
    ),
  };
  const mercenaryAttedances = matchClub.attendances.filter((a) => !!a.mercenary && a.isVote);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data != null) {
      revalidate();
    }
  }, [fetcher.state, fetcher.data, revalidate]);

  return {
    // matchDate,
    isBeforeDay,
    isCheckTimeOpen,
    attend,
    mercenaryAttedances,
    user,
    currentStatus,
    currentChecked,
    fetcher,
    revalidate,
  };
};
