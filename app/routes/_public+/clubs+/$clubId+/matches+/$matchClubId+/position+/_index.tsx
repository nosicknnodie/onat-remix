import { useNavigate, useParams } from "@remix-run/react";
import { useEffect } from "react";
import { Loading } from "~/components/Loading";
import { type PositionAssigned, PositionBoard } from "~/features/matches/client";
import {
  getAttendanceDisplayName,
  usePositionContext,
  usePositionQuery,
  useQuarterQuery,
  useTeamQuery,
} from "~/features/matches/isomorphic";
import { getContrastColor, PORMATION_POSITION_CLASSNAME } from "~/libs/isomorphic";

export const handle = {
  breadcrumb: () => {
    return <>VIEW</>;
  },
};
interface IPositionPageProps {}

const PositionPage = (_props: IPositionPageProps) => {
  const params = useParams();
  const navigate = useNavigate();

  const matchClubId = params.matchClubId;
  const quarterQuery = useQuarterQuery(matchClubId, { enabled: Boolean(matchClubId) });
  const matchClub = quarterQuery.data?.matchClub;
  const attendanceQuery = usePositionQuery(matchClub?.id, { enabled: Boolean(matchClub?.id) });
  const teamQuery = useTeamQuery(matchClub?.id, {
    clubId: params.clubId,
    enabled: Boolean(params.clubId && matchClub?.id),
  });
  const context = usePositionContext();
  const currentQuarterOrder = context?.currentQuarterOrder ?? 1;
  const currentQuarter = matchClub?.quarters.find(
    (quarter) => quarter.order === currentQuarterOrder,
  );

  useEffect(() => {
    if (quarterQuery.error && quarterQuery.error instanceof Response) {
      if (quarterQuery.error.status === 404) {
        navigate("../");
      }
    }
  }, [navigate, quarterQuery.error]);

  const teamResponse = teamQuery.data;
  useEffect(() => {
    if (teamResponse && "redirectTo" in teamResponse) {
      navigate(teamResponse.redirectTo);
    }
  }, [navigate, teamResponse]);
  const isLoadingQuarters = quarterQuery.isLoading || !matchClub;
  if (isLoadingQuarters) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  const assignedEntries =
    attendanceQuery.data?.attendances?.flatMap((attendance) =>
      attendance.assigneds.map((assigned) => ({
        ...assigned,
        attendance,
      })),
    ) ?? [];
  const isSelf = currentQuarter?.isSelf || matchClub.isSelf;
  const team1 = currentQuarter?.team1;
  const team2 = currentQuarter?.team2;
  const assigneds = assignedEntries
    .filter((assigned) => assigned.quarterId === currentQuarter?.id && assigned.position)
    .map((assigned) => {
      const { className, team1ClassName, team2ClassName } =
        PORMATION_POSITION_CLASSNAME[assigned.position];
      let computedClass = "";
      let color: string | undefined;
      if (isSelf) {
        computedClass = assigned.teamId === team1?.id ? team1ClassName || "" : team2ClassName || "";
        color = assigned.teamId === team1?.id ? team1?.color : team2?.color;
      } else {
        computedClass = className;
      }
      return {
        ...assigned,
        className: computedClass,
        color,
        contrastColor: color ? getContrastColor(color) : undefined,
      };
    });
  const assignedList: PositionAssigned[] =
    assigneds?.map((assigned) => {
      const name = getAttendanceDisplayName(assigned.attendance);
      return {
        id: assigned.id,
        name,
        className: assigned.className,
        color: assigned.color,
        contrastColor: assigned.contrastColor,
      };
    }) ?? [];

  return (
    <div className="lg:space-y-6 max-lg:space-y-2">
      <PositionBoard 
        assigned={assignedList}
        isSelf={isSelf}
        team1={team1 ? { name: team1.name, color: team1.color } : undefined}
        team2={team2 ? { name: team2.name, color: team2.color } : undefined}
      />
    </div>
  );
};

export default PositionPage;
