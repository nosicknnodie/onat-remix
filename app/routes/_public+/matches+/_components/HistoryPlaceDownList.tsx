import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useAtomValue } from "jotai/react";
import _ from "lodash";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { IKakaoLocalType } from "~/libs/map";
import { placeHistoryAtom } from "../_libs/state";

interface IHistoryPlaceDownListProps {
  onSetPlace: (place: IKakaoLocalType) => void;
}

const HistoryPlaceDownList = ({ onSetPlace }: IHistoryPlaceDownListProps) => {
  const placeHistory = useAtomValue(placeHistoryAtom);
  const handleSetPlace = (place: IKakaoLocalType) => {
    onSetPlace?.(place);
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{"등록한 장소"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {_.sortBy(placeHistory, "count")
            .reverse()
            .map((p) => (
              <DropdownMenuItem key={p.id} onClick={() => handleSetPlace(_.omit(p, ["count"]))}>
                <div>
                  <p className="font-bold">{p.place_name}</p>
                  <span className="text-sm font-light">{p.address_name}</span>
                </div>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default HistoryPlaceDownList;
