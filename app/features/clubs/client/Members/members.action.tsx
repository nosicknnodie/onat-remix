import type { JobTitle, Player, RoleType, StatusType } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useParams } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { confirm } from "~/components/ui/confirm";
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
import { useMembershipInfoQuery, usePlayerPermissionsQuery } from "../../isomorphic";
import type { IPlayer } from "../../isomorphic/types";
import { InfoDrawer } from "../index";
import { useGetPlayers } from "./member.context";

interface IMembersActionProps {
  payload: IPlayer;
}

export const MembersAction = ({ payload }: IMembersActionProps) => {
  const { clubId } = useParams();
  const { data: player } = useMembershipInfoQuery(clubId ?? "", {
    enabled: Boolean(clubId),
  });
  const { data: permissions } = usePlayerPermissionsQuery(player?.id ?? "", {
    enabled: Boolean(player?.id),
    gcTime: 1000 * 60 * 10,
  });
  const hasPlayerView = permissions?.includes("PLAYER_VIEW");
  const hasAssignManager = permissions?.includes("PLAYER_ASSIGN_MANAGER");
  const hasPlayerManage = permissions?.includes("PLAYER_MANAGE");
  const isSelf = player?.id === payload.id;
  const context = useGetPlayers();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (value: Partial<Player>) => {
      return fetch(`/api/players/${payload.id}`, {
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
    const payload: Partial<Player> = { status };
    if (status === "BANNED") {
      payload.role = "NO";
      payload.jobTitle = "NO";
    }
    await mutateAsync(payload);
    await context?.refetch();
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
              {isPending ? <Loading /> : <DotsHorizontalIcon className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{`${payload.nick} 님`}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {hasPlayerView && (
              <DropdownMenuItem>
                <InfoDrawer player={payload}>정보확인</InfoDrawer>
              </DropdownMenuItem>
            )}
            {/* <DropdownMenuItem disabled>기록(개발중)</DropdownMenuItem>
        <DropdownMenuItem disabled>출석정보(개발중)</DropdownMenuItem>
        <DropdownMenuItem disabled>매치(개발중)</DropdownMenuItem> */}
            {hasAssignManager && !isSelf && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>권한</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuCheckboxItem checked={payload.role === "MASTER"} disabled={true}>
                    MASTER
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={payload.role === "MANAGER"}
                    disabled={false}
                    onClick={() => handleChangeRole("MANAGER")}
                  >
                    매니저
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={payload.role === "NORMAL"}
                    disabled={false}
                    onClick={() => handleChangeRole("NORMAL")}
                  >
                    회원
                  </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {hasPlayerManage && (
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
                      checked={payload.jobTitle === "GENERAL_AFFAIRS"}
                      onClick={() => handleChangeJobTitle("GENERAL_AFFAIRS")}
                    >
                      총무
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={payload.jobTitle === "ASSISTANT_GENERAL_AFFAIRS"}
                      onClick={() => handleChangeJobTitle("ASSISTANT_GENERAL_AFFAIRS")}
                    >
                      부총무
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
                    onClick={(e) => {
                      e.stopPropagation();
                      confirm({
                        title: "탈퇴 처리",
                        description: `${payload.nick} 님을 탈퇴 처리하시겠습니까?`,
                        confirmText: "탈퇴",
                      }).onConfirm(() => void handleStatus("BANNED"));
                    }}
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
