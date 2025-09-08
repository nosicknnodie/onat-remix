import { Link } from "@remix-run/react";
import type { ColumnDef, Row, SortingState } from "@tanstack/react-table";
import { getFilteredRowModel, getSortedRowModel } from "@tanstack/react-table";
import type React from "react";
import DataTable from "~/components/DataTable";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export function MercenariesTable<T>({
  data,
  columns,
  newPath,
  globalFilter,
  onGlobalFilterChange,
  sorting,
  onSortingChange,
  globalFilterFn,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  newPath: string;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  sorting: SortingState;
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;
  globalFilterFn?: (row: Row<T>, columnId: string, filterValue: string) => boolean; // row type from tanstack
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>용병관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <div className="flex gap-x-2">
            <Button variant={"outline"} asChild>
              <Link to={newPath}>+ 용병 추가</Link>
            </Button>
            <Input
              className="w-36"
              onChange={(e) => onGlobalFilterChange(e.target.value)}
              placeholder="Search 용병"
            />
          </div>
        </div>
        <DataTable
          data={data}
          columns={columns}
          options={{
            state: { globalFilter, sorting },
            onSortingChange,
            getFilteredRowModel: getFilteredRowModel(),
            getSortedRowModel: getSortedRowModel(),
            ...(globalFilterFn ? { globalFilterFn } : {}),
          }}
        />
      </CardContent>
    </Card>
  );
}
