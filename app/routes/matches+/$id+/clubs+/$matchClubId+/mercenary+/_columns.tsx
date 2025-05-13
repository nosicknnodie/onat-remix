import { TypedResponse } from "@remix-run/node";
import { ColumnDef } from "@tanstack/react-table";
import _ from "lodash";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { loader } from "./_index";
type TData = Exclude<Awaited<ReturnType<typeof loader>>, TypedResponse<unknown>>["mercenaries"];

export const mercenaryColumns: ColumnDef<TData[number]>[] = [
  {
    id: "name",
    accessorFn: (v) => v.user?.name || v.name || "",
    header({ table }) {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      console.log("row.original - ", row.original);
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
            </div>
          </div>
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
      const mercenary = row.original;
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>
            {_.compact([mercenary?.position1, mercenary?.position2, mercenary?.position3]).join(
              ",",
            )}
          </span>
        </div>
      );
    },
  },
  // {
  //   id: "actions",
  //   // accessorFn: (v) => v.content,
  //   // header({ table }) {
  //   //   return <div className="flex justify-center">내용</div>;
  //   // },
  //   cell: ({ row }) => {
  //     const payload = row.original;
  //     return <MembersAction payload={payload} />;
  //   },
  // },
];
