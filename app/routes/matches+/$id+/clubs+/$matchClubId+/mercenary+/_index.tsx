import { type LoaderFunctionArgs, TypedResponse, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Row, SortingState, getFilteredRowModel, getSortedRowModel } from "@tanstack/react-table";
import Hangul from "hangul-js";
import { useState, useTransition } from "react";
import DataTable from "~/components/DataTable";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { removePhoneHyphen } from "~/libs/convert";
import { AES } from "~/libs/crypto.utils";
import { prisma } from "~/libs/db/db.server";
import { mercenaryColumns } from "./_columns";

export async function loader({ params }: LoaderFunctionArgs) {
  const matchId = params.id;
  const matchClubId = params.matchClubId;

  try {
    const matchClub = await prisma.matchClub.findUnique({
      where: {
        id: matchClubId,
      },
    });

    if (!matchClub) return redirect("/matches/" + matchId + "/clubs/" + matchClubId);

    const mercenaries = await prisma.mercenary.findMany({
      where: {
        clubId: matchClub?.clubId,
      },
      include: {
        attendances: true,
        user: {
          include: {
            userImage: true,
          },
        },
      },
    });
    const decryptMercenaries = mercenaries.map((mer) => ({
      ...mer,
      hp: mer.hp ? AES.decrypt(mer.hp) : null,
    }));
    const attedMercenaries = decryptMercenaries.filter((mer) =>
      mer.attendances.some((a) => a.matchClubId === matchClubId && a.isVote),
    );

    return { mercenaries: decryptMercenaries, attedMercenaries };
  } catch (e) {
    console.error("e - ", e);
    return redirect("/matches/" + matchId + "/clubs/" + matchClubId);
  }
}

export type IMatchClubMecenaryLoaderTData = Exclude<
  Awaited<ReturnType<typeof loader>>,
  TypedResponse<unknown>
>["mercenaries"];
interface IMatchClubMecenaryPageProps {}

const MatchClubMecenaryPage = (_props: IMatchClubMecenaryPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const attedMercenaries = loaderData.attedMercenaries;
  const [, startTransition] = useTransition();
  const mercenaries = loaderData.mercenaries;
  // const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
  // ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);

  // seatch filter
  const handleSearch = (value: string) => {
    startTransition(() => {
      setGlobalFilter(value);
    });
  };

  // global filter
  const globalFilterFn = (
    row: Row<IMatchClubMecenaryLoaderTData[number]>,
    _columnId: string,
    filterValue: string,
  ) => {
    const name = row.original.name?.toLowerCase() ?? "";
    const search = filterValue.toLowerCase();
    const hp = row.original.hp?.toLowerCase() ?? "";
    const email = row.original.user?.email?.toLowerCase() ?? "";
    const convertHp = removePhoneHyphen(hp);
    const searchHp = removePhoneHyphen(search);

    return (
      Hangul.search(name, search) >= 0 || convertHp.includes(searchHp) || email.includes(search)
    );
  };

  return (
    <>
      <div className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>용병관리</CardTitle>
            <CardDescription>클럽내의 용병 관리 페이지 입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <div className="flex gap-x-2">
                <Button variant={"outline"} asChild>
                  <Link to={"./new"}>+ 용병 추가</Link>
                </Button>
                <Input
                  className="w-36"
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search 용병"
                />
              </div>
            </div>
            <DataTable
              data={mercenaries}
              columns={mercenaryColumns}
              options={{
                state: {
                  // columnFilters: columnFilters,
                  globalFilter: globalFilter,
                  sorting: sorting,
                },
                onSortingChange: setSorting,
                getFilteredRowModel: getFilteredRowModel(),
                getSortedRowModel: getSortedRowModel(),
                globalFilterFn,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MatchClubMecenaryPage;
