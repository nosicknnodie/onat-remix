import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type TableOptions,
  useReactTable,
} from "@tanstack/react-table";
import _ from "lodash";
import { useMemo } from "react";
import { cn } from "~/libs/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface ITableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  options?: Partial<TableOptions<TData>>;
  className?: string;
}

const DataTable = <TData, TValue>({
  data,
  columns,
  options,
  className,
}: ITableProps<TData, TValue>) => {
  const tableData = useMemo(() => data ?? [], [data]);

  const table = useReactTable(
    _.assign(
      {
        data: tableData,
        columns: columns,
        getCoreRowModel: getCoreRowModel(),
      },
      options,
    ),
  );
  return (
    <Table
      className={cn(
        "w-full text-foreground border-spacing-0 border-0 border-collapse shadow-sm max-h-full",
        className,
      )}
    >
      <TableHeader className="sticky top-0 z-10 bg-white">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow className="border-primary/20" key={headerGroup.id}>
            {headerGroup.headers.map((header, index, array) => {
              return (
                <TableHead
                  className={cn(
                    "text-center py-[10px] px-[6px] font-medium bg-primary-foreground text-primary cursor-pointer select-none",
                    {
                      "rounded-tl-md": index === 0,
                      "rounded-tr-md": index === array.length - 1,
                    },
                  )}
                  key={header.id}
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : (
                    <div className="flex items-center justify-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {
                        {
                          asc: "▲",
                          desc: "▼",
                        }[header.column.getIsSorted() as string]
                      }
                    </div>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className="last:border-b last:border-solid last:border-primary/20">
        {table.getRowModel().rows.map((row) => (
          <TableRow
            className="border-b border-dashed border-primary/10 hover:bg-primary-foreground/50 hover:text-primary "
            key={row.id}
            data-state={row.getIsSelected() ? "selected" : ""}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                className="text-sm font-[300] leading-[18px] text-center py-[10px] table-cell text-inherit indent-[initial]"
                key={cell.id}
                style={{ width: cell.column.getSize() }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DataTable;
