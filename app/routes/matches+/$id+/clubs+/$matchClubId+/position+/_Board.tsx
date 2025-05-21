import { Team } from "@prisma/client";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface IBoardProps {
  teams: Team[];
}

export const Board = ({ teams }: IBoardProps) => {
  const [leftBoardId, setLeftBoardId] = useState<string | undefined>(teams.at(0)?.id);
  const [rightBoardId, setRightBoardId] = useState<string | undefined>(teams.at(1)?.id);

  return (
    <>
      <section>
        <div className="w-full overflow-hidden pb-[154.41%] relative md:hidden">
          {/* 모바일 */}
          <img
            src={"/images/test-vertical.svg"}
            alt="soccer field"
            className="absolute top-0 left-0 w-full h-full"
          ></img>
        </div>
        <div className="w-full overflow-hidden pb-[64.76%] relative max-md:hidden">
          {/* 데스크탑 */}
          <Select value={leftBoardId} onValueChange={setLeftBoardId}>
            <SelectTrigger className="z-20 absolute top-2 left-2 max-w-36 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams?.map((team) => {
                return (
                  <SelectItem
                    key={team.id}
                    value={team.id}
                    disabled={team.id === leftBoardId || team.id === rightBoardId}
                  >
                    {team.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={rightBoardId} onValueChange={setRightBoardId}>
            <SelectTrigger className="z-20 absolute top-2 right-2 max-w-36 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams?.map((team) => {
                return (
                  <SelectItem
                    key={team.id}
                    value={team.id}
                    disabled={team.id === leftBoardId || team.id === rightBoardId}
                  >
                    {team.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
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
