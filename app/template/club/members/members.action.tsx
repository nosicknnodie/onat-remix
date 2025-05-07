import { JobTitle, Player, RoleType } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
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
import { useGetPlayers } from "./member.context";
import { IPlayer } from "./members.columns";

interface IMembersActionProps {
  payload: IPlayer;
}

export const MembersAction = ({ payload }: IMembersActionProps) => {
  const isMaster = payload.role === "MASTER";
  const isManager = payload.role === "MANAGER";
  const isNormal = payload.role === "NORMAL";
  const query = useGetPlayers();
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
    await query?.refetch();
  };
  const handleChangeRole = async (role: RoleType) => {
    await mutateAsync({ role });
    await query?.refetch();
  };
  const handleInjury = async (isInjury: boolean) => {
    await mutateAsync({ isInjury });
    await query?.refetch();
  };
  const handleIsRest = async (isRest: boolean) => {
    await mutateAsync({ isRest });
    await query?.refetch();
  };
  const handleIsExit = async (isExit: boolean) => {
    await mutateAsync({ isExit });
    await query?.refetch();
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
            <DropdownMenuItem disabled>정보확인(개발중)</DropdownMenuItem>
            {/* <DropdownMenuItem disabled>기록(개발중)</DropdownMenuItem>
            <DropdownMenuItem disabled>출석정보(개발중)</DropdownMenuItem>
            <DropdownMenuItem disabled>매치(개발중)</DropdownMenuItem> */}
            {isMaster && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>권한</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {isMaster && (
                    <DropdownMenuCheckboxItem
                      checked={isMaster}
                      disabled={true}
                    >
                      MASTER
                    </DropdownMenuCheckboxItem>
                  )}
                  <DropdownMenuCheckboxItem
                    checked={isManager}
                    disabled={isMaster}
                    onClick={() => handleChangeRole("MANAGER")}
                  >
                    매니저
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={isNormal}
                    disabled={isMaster}
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
                {isNormal && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleIsExit(true)}
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
