import { Link, useLoaderData } from "@remix-run/react";
import { AiFillSkin } from "react-icons/ai";
import { Button } from "~/components/ui/button";
import { type PositionAssigned, PositionBoard, PositionTeamActions } from "~/features/matches";
import { PORMATION_POSITION_CLASSNAME } from "~/libs/const/position.const";
import type { loader } from "./_index";
import { usePositionContext, usePositionUpdate } from "./_position.context";

export const Board = () => {
  const loaderData = useLoaderData<typeof loader>();
  const context = usePositionContext();
  const currentQuarterOrder = context?.currentQuarterOrder;
  const currentQuarter = loaderData.matchClub.quarters.find(
    (quarter) => quarter.order === currentQuarterOrder,
  );
  const isSelf = currentQuarter?.isSelf || loaderData.matchClub.isSelf;
  const team1 = currentQuarter?.team1;
  const team2 = currentQuarter?.team2;

  const assigneds = context?.query.data?.attendances
    .flatMap((attendance) =>
      attendance.assigneds.map((assigned) => ({
        ...assigned,
        attendance,
      })),
    )
    .filter((assigned) => assigned.quarterId === currentQuarter?.id && assigned.position)
    .map((assigned) => {
      const isSelf = currentQuarter?.isSelf || loaderData.matchClub.isSelf;
      const { className, team1ClassName, team2ClassName } =
        PORMATION_POSITION_CLASSNAME[assigned.position];
      let _className = "";
      let _color: string | undefined;
      if (isSelf) {
        _className = assigned.teamId === team1?.id ? team1ClassName || "" : team2ClassName || "";
        _color = assigned.teamId === team1?.id ? team1?.color : team2?.color;
      } else {
        _className = className;
      }
      return {
        ...assigned,
        className: _className,
        color: _color,
      };
    });
  usePositionUpdate({
    url: `${loaderData.env.WS_SERVER_URL}/position?id=${currentQuarter?.id}`,
  });

  const headerLeft = team1 ? (
    <PositionTeamActions
      teamId={team1.id}
      teams={loaderData.matchClub.teams}
      currentTeam={team1}
      currentQuarterOrder={currentQuarterOrder}
      team1Id={team1?.id || null}
      team2Id={team2?.id || null}
      settingHref={`./setting?quarter=${currentQuarterOrder}&teamId=${team1.id}`}
    >
      <Button
        variant={"outline"}
        className="z-20 absolute top-2 left-2 max-w-36 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none focus-visible:ring-0 focus-visible:outline-none"
      >
        <AiFillSkin color={team1?.color} className="drop-shadow mr-1" />
        {team1.name}
      </Button>
    </PositionTeamActions>
  ) : null;

  const headerRight = team2 ? (
    <PositionTeamActions
      teamId={team2.id}
      teams={loaderData.matchClub.teams}
      currentTeam={team2}
      currentQuarterOrder={currentQuarterOrder}
      team1Id={team1?.id || null}
      team2Id={team2?.id || null}
      settingHref={`./setting?quarter=${currentQuarterOrder}&teamId=${team2.id}`}
    >
      <Button
        variant={"outline"}
        className="z-20 absolute top-2 right-2 max-w-36 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none focus-visible:ring-0 focus-visible:outline-none"
      >
        <AiFillSkin color={team2.color} className="drop-shadow mr-1" />
        {team2.name}
      </Button>
    </PositionTeamActions>
  ) : null;

  const settingButton = !isSelf ? (
    <Button variant={"outline"} asChild className="z-20 absolute top-2 right-2">
      <Link to={{ pathname: "./setting", search: `quarter=${currentQuarterOrder}` }}>
        포지션 설정
      </Link>
    </Button>
  ) : null;

  const assignedList: PositionAssigned[] =
    assigneds?.map((assigned) => {
      const name =
        assigned.attendance.player?.user?.name ||
        assigned.attendance.mercenary?.user?.name ||
        assigned.attendance.mercenary?.name ||
        "";
      return { id: assigned.id, name, className: assigned.className, color: assigned.color };
    }) ?? [];

  return (
    <PositionBoard
      headerLeft={headerLeft}
      headerRight={headerRight}
      settingButton={settingButton}
      assigned={assignedList}
    />
  );
};
