/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: off */
import type { ColumnDef } from "@tanstack/react-table";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatPhoneNumber } from "~/libs/isomorphic";
import Actions from "./Actions";

export type MercenaryRow = {
  id: string;
  name?: string | null;
  hp?: string | null;
  description?: string | null;
  position1?: string | null;
  position2?: string | null;
  position3?: string | null;
  user?: {
    name?: string | null;
    userImage?: { url?: string | null } | null;
    email?: string | null;
  } | null;
  attendances?: {
    isVote: boolean;
    isCheck: boolean;
    matchClub: { match: { title: string; stDate: string | Date } };
    matchClubId?: string;
  }[];
};

type MercenaryColumnOptions = {
  isMobile?: boolean;
};

export function mercenaryColumns<T extends MercenaryRow>(
  options?: MercenaryColumnOptions,
): ColumnDef<T>[] {
  const isMobile = options?.isMobile ?? false;

  const nameColumn: ColumnDef<T> = {
    id: "name",
    accessorFn: (v) => (v as MercenaryRow).user?.name || (v as MercenaryRow).name || "",
    header() {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center truncate space-x-2">
          {(row.original as MercenaryRow)?.user?.userImage?.url && (
            <Avatar>
              <AvatarImage
                src={
                  (row.original as MercenaryRow)?.user?.userImage?.url || "/images/user_empty.png"
                }
              />
              <AvatarFallback className="bg-primary-foreground">
                <Loading />
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <div className="flex space-x-2 items-center h-5">
              <span className="text-base font-semibold">{row.getValue("name")}</span>
            </div>
          </div>
        </div>
      );
    },
  };

  const hpColumn: ColumnDef<T> = {
    id: "hp",
    accessorFn: (v) => (v as MercenaryRow).hp || "",
    header() {
      return <div className="flex justify-center">전화번호</div>;
    },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span>{row.original.hp ? formatPhoneNumber(row.original.hp) : "-"}</span>
      </div>
    ),
  };

  const attendanceColumn: ColumnDef<T> = {
    id: "attendance",
    accessorFn: (v) => ((v as MercenaryRow).attendances ?? []).some((a) => a.isVote),
    header() {
      return <div className="flex justify-center">매칭참여</div>;
    },
    cell: ({ row }) => {
      const hasVote = (row.original as MercenaryRow).attendances?.some((a) => a.isVote) ?? false;
      return (
        <div className="flex justify-center">
          <span className="text-sm">{hasVote ? "참여" : "-"}</span>
        </div>
      );
    },
    enableSorting: true,
    sortingFn: "basic",
  };

  const positionColumn: ColumnDef<T> = {
    id: "positions",
    header() {
      return <div className="flex justify-center">포지션</div>;
    },
    cell: ({ row }) => {
      const positions = [
        (row.original as MercenaryRow).position1,
        (row.original as MercenaryRow).position2,
        (row.original as MercenaryRow).position3,
      ].filter(Boolean);
      return <div className="flex justify-center text-sm">{positions.join(", ") || "-"}</div>;
    },
  };

  const descriptionColumn: ColumnDef<T> = {
    id: "description",
    header() {
      return <div className="flex justify-center">설명</div>;
    },
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground truncate">
        {(row.original as MercenaryRow).description || "-"}
      </div>
    ),
  };

  const actionsColumn: ColumnDef<T> = {
    id: "actions",
    cell: ({ row }) => {
      const payload = row.original as unknown as MercenaryRow;
      return <Actions payload={payload} />;
    },
  };

  if (isMobile) {
    return [nameColumn, hpColumn, attendanceColumn, actionsColumn];
  }

  return [nameColumn, hpColumn, attendanceColumn, positionColumn, descriptionColumn, actionsColumn];
}
