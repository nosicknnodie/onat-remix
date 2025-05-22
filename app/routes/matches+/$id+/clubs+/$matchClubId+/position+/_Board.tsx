import { useLoaderData } from "@remix-run/react";
import { AiFillSkin } from "react-icons/ai";
import { Button } from "~/components/ui/button";
import { Actions } from "./_Actions";
import { loader } from "./_index";
import { usePositionContext } from "./_position.context";

export const Board = () => {
  const loaderData = useLoaderData<typeof loader>();
  const context = usePositionContext();
  const teams = loaderData.matchClub.teams;
  const currentQuarterOrder = context.currentQuarterOrder;
  const currentQuarter = loaderData.matchClub.quarters.find(
    (quarter) => quarter.order === currentQuarterOrder,
  );
  const team1 = currentQuarter?.team1;
  const team2 = currentQuarter?.team2;
  // const [leftBoardId, setLeftBoardId] = useState<string | undefined>(teams.at(0)?.id);
  // const [rightBoardId, setRightBoardId] = useState<string | undefined>(teams.at(1)?.id);

  return (
    <>
      <section>
        <div className="w-full overflow-hidden pb-[154.41%] relative md:hidden">
          {team1 && (
            <Actions teamId={team1.id}>
              <Button
                variant={"outline"}
                size="sm"
                className="z-20 absolute top-1 right-1 max-w-24 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none focus-visible:ring-0 focus-visible:outline-none"
              >
                <AiFillSkin color={team1?.color} className="drop-shadow mr-1" />
                {team1.name}
              </Button>
            </Actions>
          )}
          {team2 && (
            <Actions teamId={team2.id}>
              <Button
                variant={"outline"}
                size="sm"
                className="z-20 absolute bottom-1 right-1 max-w-24 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none focus-visible:ring-0 focus-visible:outline-none"
              >
                <AiFillSkin color={team2.color} className="drop-shadow mr-1" />
                {team2.name}
              </Button>
            </Actions>
          )}
          {/* 모바일 */}
          <img
            src={"/images/test-vertical.svg"}
            alt="soccer field"
            className="absolute top-0 left-0 w-full h-full"
          ></img>
        </div>
        <div className="w-full overflow-hidden pb-[64.76%] relative max-md:hidden">
          {/* 데스크탑 */}
          {team1 && (
            <Actions teamId={team1.id}>
              <Button
                variant={"outline"}
                className="z-20 absolute top-2 left-2 max-w-36 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none focus-visible:ring-0 focus-visible:outline-none"
              >
                <AiFillSkin color={team1?.color} className="drop-shadow mr-1" />
                {team1.name}
              </Button>
            </Actions>
          )}
          {team2 && (
            <Actions teamId={team2.id}>
              <Button
                variant={"outline"}
                className="z-20 absolute top-2 right-2 max-w-36 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none focus-visible:ring-0 focus-visible:outline-none"
              >
                <AiFillSkin color={team2.color} className="drop-shadow mr-1" />
                {team2.name}
              </Button>
            </Actions>
          )}
          <img
            src={"/images/test.svg"}
            alt="soccer field"
            className="absolute top-0 left-0 w-full h-full z-10"
          ></img>
        </div>
      </section>
    </>
  );
};
