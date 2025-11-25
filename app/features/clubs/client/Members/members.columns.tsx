/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: off */
import type { ColumnDef } from "@tanstack/react-table";
import _ from "lodash";
import { FaStar } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getPlayerDisplayName } from "~/features/matches/isomorphic";
import type { IPlayer } from "../../isomorphic/types";
import { MembersAction } from "./members.action";

const jobTitleLabelMap = {
  CHAIRMAN: "회장",
  VICE_CHAIRMAN: "부회장",
  GENERAL_AFFAIRS: "총무",
  ASSISTANT_GENERAL_AFFAIRS: "부총무",
  DIRECTOR: "감독",
  COACH: "코치",
  OPERATOR: "운영",
  ADVISER: "고문",
  NO: "회원",
} as const;

const roleIconMap = {
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
} as const;

export const memberColumns: ColumnDef<IPlayer>[] = [
  {
    id: "name",
    accessorFn: (v) => getPlayerDisplayName(v),
    header({ table }) {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      const nickLabel = row.original.nick ?? row.original.user?.nick ?? "";
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
              {nickLabel ? <span className="text-xs text-gray-500">({nickLabel})</span> : null}
            </div>
            <div className="flex space-x-2">
              <span className="text-xs text-gray-500 place-items-center">
                {jobTitleLabelMap[(row.original.jobTitle ?? "NO") as keyof typeof jobTitleLabelMap]}
              </span>
              {roleIconMap[(row.original.role ?? "NORMAL") as keyof typeof roleIconMap]}
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
