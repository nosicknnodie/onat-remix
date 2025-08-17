/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: off */
import type { File, Player, User } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import _ from "lodash";
import { FaStar } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { MembersAction } from "./members.action";
export interface IPlayer extends Player {
  user?: User & { userImage?: File | null };
}

export const memberColumns: ColumnDef<IPlayer>[] = [
  {
    id: "name",
    accessorFn: (v) => v.user?.name || "",
    header({ table }) {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center truncate space-x-2">
          <Avatar>
            <AvatarImage src={row.original?.user?.userImage?.url || "/images/user_empty.png"} />

            <AvatarFallback className="bg-primary-foreground">
              <Loading />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex space-x-2 items-center h-5">
              <span className="text-base font-semibold">{row.getValue("name")}</span>
              <span className="text-xs text-gray-500">({row.original.nick})</span>
            </div>
            <div className="flex space-x-2">
              <span className="text-xs text-gray-500 place-items-center">
                {
                  {
                    CHAIRMAN: "회장", // 회장
                    VICE_CHAIRMAN: "부회장", // 부회장
                    DIRECTOR: "감독", // 감독
                    COACH: "코치", // 코치
                    OPERATOR: "운영", // 운영
                    ADVISER: "고문", // 고문
                    NO: "회원", // 없음
                  }[row.original.jobTitle ?? "NO"]
                }
              </span>
              {
                {
                  MASTER: (
                    <span className="text-xs text-orange-500">
                      <FaStar />
                    </span>
                  ),
                  MANAGER: (
                    <span className="text-xs text-gray-500">
                      <FaStar />
                    </span>
                  ),
                  NORMAL: "",
                  PENDING: "",
                }[row.original.role ?? "NORMAL"]
              }
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "birth",
    accessorFn: (v) => v.user?.birth,
    header({ table }) {
      return <div className="flex justify-center">생년월일</div>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>{row.getValue("birth")}</span>
        </div>
      );
    },
  },
  {
    id: "positions",
    // accessorFn: (v) => v.fromProfile?.birth,
    header({ table }) {
      return <div className="flex justify-center">포지션</div>;
    },
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>{_.compact([user?.position1, user?.position2, user?.position3]).join(",")}</span>
        </div>
      );
    },
  },
  {
    id: "state",
    // accessorFn: (v) => v.fromProfile?.birth,
    header({ table }) {
      return <div className="flex justify-center">상태</div>;
    },
    cell: ({ row }) => {
      const payload = row.original;
      return (
        <div className="flex justify-center items-center space-x-2">
          {payload.isInjury && <span>부상중</span>}
          {payload.isRest && <span>휴식중</span>}
        </div>
      );
    },
  },
  {
    id: "actions",
    // accessorFn: (v) => v.content,
    // header({ table }) {
    //   return <div className="flex justify-center">내용</div>;
    // },
    cell: ({ row }) => {
      const payload = row.original;
      return <MembersAction payload={payload} />;
    },
  },
];
