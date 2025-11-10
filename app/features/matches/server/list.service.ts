import dayjs from "dayjs";
import * as q from "./list.queries";

export async function getIndexData(userId?: string) {
  const [matches, myClubIds] = await Promise.all([
    q.getMatchesWithClubs(),
    userId ? q.getApprovedPlayerClubIds(userId) : Promise.resolve([] as string[]),
  ]);

  const now = new Date();
  const startOfToday = dayjs().startOf("day").toDate();
  const endOfToday = dayjs().endOf("day").toDate();

  const myMatches = matches.filter((m) => m.matchClubs.some((mc) => myClubIds.includes(mc.clubId)));
  const publicMatches = matches.filter(
    (m) => !m.matchClubs.some((mc) => myClubIds.includes(mc.clubId)),
  );
  const categorized = {
    my: {
      today: myMatches.filter((m) => {
        const date = new Date(m.stDate!);
        return date >= startOfToday && date <= endOfToday;
      }),
      upcoming: myMatches.filter((m) => new Date(m.stDate!) > endOfToday),
      past: myMatches.filter((m) => new Date(m.stDate!) < startOfToday),
    },
    public: {
      upcoming: publicMatches.filter((m) => new Date(m.stDate!) > now),
      ongoing: publicMatches.filter((m) => {
        const date = new Date(m.stDate!);
        return date >= startOfToday && date <= endOfToday;
      }),
    },
  };

  return { categorized, myClubIds };
}
