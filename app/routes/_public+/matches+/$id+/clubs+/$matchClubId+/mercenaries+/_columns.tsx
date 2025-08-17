/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: off */
import type { ColumnDef } from "@tanstack/react-table";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatPhoneNumber } from "~/libs/convert";
import Actions from "./_actions";
import type { IMatchClubMecenaryLoaderTData } from "./_index";

export const mercenaryColumns: ColumnDef<IMatchClubMecenaryLoaderTData[number]>[] = [
  {
    id: "name",
    accessorFn: (v) => v.user?.name || v.name || "",
    header({ table }) {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      const hp = row.original?.hp;
      return (
        <div className="flex justify-center items-center truncate space-x-2">
          {row.original?.user?.userImage?.url && (
            <Avatar>
              <AvatarImage src={row.original?.user?.userImage?.url || "/images/user_empty.png"} />
              <AvatarFallback className="bg-primary-foreground">
                <Loading />
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <div className="flex space-x-2 items-center h-5">
              <span className="text-base font-semibold">{row.getValue("name")}</span>
              {/* {user?.email && (
                <>
                  <Separator orientation="vertical" />
                  <span className="text-sm">{user?.email}</span>
                </>
              )} */}
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
    id: "description",
    accessorFn: (v) => v.description,
    header({ table }) {
      return <div className="flex justify-center">설명</div>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>{row.getValue("description")}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payload = row.original;
      return <Actions payload={payload} />;
    },
  },
];
