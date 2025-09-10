/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: off */
import type { ColumnDef } from "@tanstack/react-table";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatPhoneNumber } from "~/libs";
import Actions from "./Actions";

export type MercenaryRow = {
  id: string;
  name?: string | null;
  hp?: string | null;
  user?: {
    name?: string | null;
    userImage?: { url?: string | null } | null;
    email?: string | null;
  } | null;
  attendances?: {
    isVote: boolean;
    isCheck: boolean;
    matchClub: { match: { title: string; stDate: string | Date } };
  }[];
};

export function mercenaryColumns<T extends MercenaryRow>(): ColumnDef<T>[] {
  const cols: ColumnDef<T>[] = [
    {
      id: "name",
      accessorFn: (v) => (v as MercenaryRow).user?.name || (v as MercenaryRow).name || "",
      header() {
        return <div className="flex justify-center">이름</div>;
      },
      cell: ({ row }) => {
        const hp = (row.original as MercenaryRow)?.hp;
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
              {hp && (
                <div className="flex space-x-2 items-center h-5">
                  <span className="text-sm">{formatPhoneNumber(hp)}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payload = row.original as unknown as MercenaryRow;
        return <Actions payload={payload} />;
      },
    },
  ];
  return cols;
}
