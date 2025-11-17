/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: off */
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import _ from "lodash";
import { FaStar } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { IPlayer } from "../../isomorphic/types";
import { PendingsAction } from "./pendings.action";

export const pendingsColumns: ColumnDef<IPlayer>[] = [
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
                    NO: "대기회원", // 없음
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
                  NO: "",
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
          <span>
            {row.getValue("birth") ? dayjs(row.getValue("birth")).format("YYYY-MM-DD") : "-"}
          </span>
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
      const compacted = _.compact([user?.position1, user?.position2, user?.position3]);
      const positions = compacted.length > 0 ? compacted.join(",") : "-";
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>{positions}</span>
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
      return <PendingsAction payload={payload} />;
    },
  },
];
