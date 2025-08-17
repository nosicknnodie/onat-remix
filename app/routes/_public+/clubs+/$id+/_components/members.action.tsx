import { JobTitle, Player, RoleType, StatusType } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useOutletContext } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { IClubLayoutLoaderData } from "../_layout";
import InfoDrawer from "./InfoDrawer";
import { useGetPlayers } from "./member.context";
import { IPlayer } from "./members.columns";

interface IMembersActionProps {
  payload: IPlayer;
}

export const MembersAction = ({ payload }: IMembersActionProps) => {
  const { player } = useOutletContext<IClubLayoutLoaderData>();
  const isMaster = player?.role === "MASTER";
  const isManager = player?.role === "MANAGER";
  // const isNormal = player?.role === "NORMAL";
  const context = useGetPlayers();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (value: Partial<Player>) => {
      return fetch("/api/players/" + payload.id, {
        method: "POST",
        body: JSON.stringify({ ...value }),
      });
    },
  });
  const handleChangeJobTitle = async (jobTitle: JobTitle) => {
    await mutateAsync({ jobTitle });
    await context?.refetch();
  };
  const handleChangeRole = async (role: RoleType) => {
    await mutateAsync({ role });
    await context?.refetch();
  };
  const handleInjury = async (isInjury: boolean) => {
    await mutateAsync({ isInjury });
    await context?.refetch();
  };
  const handleIsRest = async (isRest: boolean) => {
    await mutateAsync({ isRest });
    await context?.refetch();
  };
  const handleStatus = async (status: StatusType) => {
    if (status === "BANNED") {
      await mutateAsync({ status, role: "PENDING", jobTitle: "NO" });
      await context?.refetch();
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
              disabled={isPending}
            >
              <span className="sr-only">Open menu</span>
              {isPending ? (
                <Loading />
              ) : (
                <DotsHorizontalIcon className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{`${payload.nick} 님`}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <InfoDrawer player={payload}>정보확인</InfoDrawer>
            </DropdownMenuItem>
            {/* <DropdownMenuItem disabled>기록(개발중)</DropdownMenuItem>
            <DropdownMenuItem disabled>출석정보(개발중)</DropdownMenuItem>
            <DropdownMenuItem disabled>매치(개발중)</DropdownMenuItem> */}
            {isMaster && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>권한</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {isMaster && (
                    <DropdownMenuCheckboxItem
                      checked={payload.role === "MASTER"}
                      disabled={true}
                    >
                      MASTER
                    </DropdownMenuCheckboxItem>
                  )}
                  <DropdownMenuCheckboxItem
                    checked={payload.role === "MANAGER"}
                    disabled={!isMaster}
                    onClick={() => handleChangeRole("MANAGER")}
                  >
                    매니저
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={payload.role === "NORMAL"}
                    disabled={!isMaster && !isManager}
                    onClick={() => handleChangeRole("NORMAL")}
                  >
                    회원
                  </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {(isManager || isMaster) && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>직책</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuCheckboxItem
                      checked={payload.jobTitle === "CHAIRMAN"}
                      onClick={() => handleChangeJobTitle("CHAIRMAN")}
                    >
                      회장
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={payload.jobTitle === "VICE_CHAIRMAN"}
                      onClick={() => handleChangeJobTitle("VICE_CHAIRMAN")}
                    >
                      부회장
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={payload.jobTitle === "DIRECTOR"}
                      onClick={() => handleChangeJobTitle("DIRECTOR")}
                    >
                      감독
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={payload.jobTitle === "COACH"}
                      onClick={() => handleChangeJobTitle("COACH")}
                    >
                      코치
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={payload.jobTitle === "OPERATOR"}
                      onClick={() => handleChangeJobTitle("OPERATOR")}
                    >
                      운영진
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={payload.jobTitle === "ADVISER"}
                      onClick={() => handleChangeJobTitle("ADVISER")}
                    >
                      고문
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={payload.jobTitle === "NO" || !payload.jobTitle}
                      onClick={() => handleChangeJobTitle("NO")}
                    >
                      회원
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>상태</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuCheckboxItem
                      checked={payload.isInjury}
                      onClick={() => handleInjury(!payload.isInjury)}
                    >
                      부상공백기
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={payload.isRest}
                      onClick={() => handleIsRest(!payload.isRest)}
                    >
                      휴식기
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {payload.role === "NORMAL" && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleStatus("BANNED")}
                  >
                    탈퇴
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
