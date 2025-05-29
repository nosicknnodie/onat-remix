import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useRevalidator, useSearchParams } from "@remix-run/react";
import { useAtom } from "jotai/react";
import { atomWithStorage } from "jotai/utils";
import { useState, useTransition } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Preview } from "react-dnd-preview";
import { TouchBackend } from "react-dnd-touch-backend";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import DragButton from "~/components/dnd/DragButton";
import DropDiv from "~/components/dnd/DropDiv";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  PORMATION_POSITIONS,
  PORMATION_POSITION_CLASSNAME,
  PORMATION_TYPE,
  POSITION_TEMPLATE_LIST,
  POSITION_TYPE,
} from "~/libs/const/position.const";
import { typedEntries } from "~/libs/convert";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";
import { PositionSettingDrawer } from "./_Drawer";
import {
  PositionSettingContext,
  useOptimisticPositionUpdate,
  usePositionSettingQuery,
} from "./_context";
const isTouchDevice = () => {
  return typeof window !== "undefined" ? "ontouchstart" in window : false;
};

const bandendForDND = isTouchDevice() ? TouchBackend : HTML5Backend;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const matchClubId = params.matchClubId!;
  const matchClub = await prisma.matchClub.findUnique({
    where: {
      id: matchClubId,
    },
    include: {
      quarters: { include: { team1: true, team2: true } },
      teams: true,
      attendances: {
        where: {
          isVote: true,
        },
        include: {
          assigneds: true,
          player: { include: { user: { include: { userImage: true } } } },
          mercenary: { include: { user: { include: { userImage: true } } } },
        },
      },
    },
  });
  if (!matchClub) return redirect("../");

  return { matchClub };
};

const POSITION_TEMPLATE = atomWithStorage<PORMATION_TYPE>("POSITION_TEMPLATE", "4-3-3");

interface IPositionSettingPageProps {}

const PositionSettingPage = (_props: IPositionSettingPageProps) => {
  const [positionTemplate, setPositionTemplate] = useAtom(POSITION_TEMPLATE);
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const matchClub = loaderData.matchClub;
  const { revalidate } = useRevalidator();
  const { mutateAsync } = useOptimisticPositionUpdate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPositionType, setSelectedPositionType] = useState<POSITION_TYPE>("GK");
  const [currentQuarterOrder, setCurrentQuarterOrder] = useState(
    Number(searchParams.get("quarter")) || 1,
  );
  const currentQuarter =
    matchClub.quarters.find((quarter) => quarter.order === currentQuarterOrder) || null;
  const [currentTeamId, setCurrentTeamId] = useState(
    searchParams.get("teamId") || matchClub.teams.at(0)?.id || null,
  );
  const [isLoading, startTransition] = useTransition();

  // const { data: quarterData } = useQuery<{ quarter: QuarterWithAssigneds }>({
  //   queryKey: ["MATCH_POSITION_SETTING_QUARTER", currentQuarter?.id],
  //   queryFn: async () => {
  //     if (!currentQuarter) return null;
  //     return fetch("/api/quarters/" + currentQuarter.id).then((res) => res.json());
  //   },
  // });
  const query = usePositionSettingQuery();
  const attendancesData = query.data;

  /**
   * 쿼터가 최대 쿼터보다 많으면 증가시킴
   * @param quarter
   */
  const handleSetQuarter = (order: number) => {
    startTransition(async () => {
      const quarterId = matchClub.quarters.find((quarter) => quarter.order === order)?.id;
      if (!quarterId) {
        const maxOrder = matchClub.quarters.reduce((max, q) => {
          return q.order > max ? q.order : max;
        }, 0);
        await fetch("/api/quarters/new", {
          method: "POST",
          body: JSON.stringify({
            matchClubId: matchClub.id,
            order: maxOrder + 1,
          }),
        });
        revalidate();
      }
      setCurrentQuarterOrder(order);
    });
  };
  const maxPlayers = 11;
  // 배정인원 list
  const assigneds = attendancesData?.attendances
    .flatMap((attendance) =>
      attendance.assigneds.map((assigned) => ({
        ...assigned,
        attendance,
      })),
    )
    .filter(
      (assigned) => assigned.quarterId === currentQuarter?.id && assigned.teamId === currentTeamId,
    );

  const positions = typedEntries(PORMATION_POSITION_CLASSNAME).map(([position, { className }]) => {
    const assigned = assigneds?.find((assigned) => assigned.position === position) || null;
    let isFormation = PORMATION_POSITIONS[positionTemplate].includes(position);
    // 인원이 11명이 다 차면 isFormation를 false로
    isFormation = (assigneds?.length || 0) >= maxPlayers ? false : isFormation;
    // 배정이 있으면 isFormation를 false로
    isFormation = assigned?.attendance ? false : isFormation;

    return {
      key: position,
      className,
      assigned,
      isFormation,
    };
  });

  const handlePositionClick = (position: POSITION_TYPE) => () => {
    setSelectedPositionType(position);
    setDrawerOpen(true);
  };

  const handlePositionChange =
    (position: POSITION_TYPE) =>
    <T extends NonNullable<typeof assigneds>[number] | null>(item: T) => {
      if (!item) return;
      startTransition(async () => {
        await mutateAsync({
          assignedId: item.id,
          toPosition: position,
          attendanceId: item.attendance.id,
        });
        // await fetch("/api/assigneds/position", {
        //   method: "POST",
        //   body: JSON.stringify({
        //     assignedId: item.id,
        //     toPosition: position,
        //   }),
        // });
        // await query.refetch();
      });
    };

  return (
    <>
      <PositionSettingContext value={{ query, currentQuarter, currentTeamId, assigneds }}>
        <section className="flex justify-between items-center">
          <div className="min-w-24">
            {currentTeamId && (
              <Select value={currentTeamId} onValueChange={setCurrentTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {matchClub.teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex justify-center items-center flex-1 min-w-40">
            <Button
              variant="ghost"
              disabled={currentQuarterOrder === 1 || isLoading}
              onClick={() => setCurrentQuarterOrder((prev) => prev - 1)}
            >
              <FaArrowLeft />
            </Button>
            <div>{currentQuarterOrder} Q</div>
            <Button
              variant="ghost"
              disabled={isLoading}
              onClick={() => handleSetQuarter(currentQuarterOrder + 1)}
            >
              <FaArrowRight />
            </Button>
          </div>
          <div className="min-w-24">
            <Select
              value={positionTemplate}
              onValueChange={(v: PORMATION_TYPE) => setPositionTemplate(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="포지션 템플릿 선택" />
              </SelectTrigger>
              <SelectContent>
                {POSITION_TEMPLATE_LIST.map((template) => (
                  <SelectItem key={template} value={template}>
                    {template}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>
        <section>
          <div className="w-full overflow-hidden max-md:pb-[154.41%] md:pb-[64.76%] relative">
            <div className="absolute top-0 left-0 w-full h-full z-10 max-md:bg-[url('/images/test-vertical.svg')] md:bg-[url('/images/test.svg')] bg-cover bg-center" />
            <div className="absolute top-0 right-0 z-20 p-2">
              <Button variant="outline">자동배치</Button>
            </div>
            <DndProvider
              backend={bandendForDND}
              options={{
                enableKeyboardEvents: true,
                enableMouseEvents: true,
                enableTouchEvents: true,
              }}
            >
              {isTouchDevice() && (
                <Preview
                  generator={({ ref, style, item }) => {
                    const assigned = item as {
                      attendance: {
                        player: {
                          user: { name: string };
                        };
                        mercenary: { user: { name: string }; name: string };
                      };
                    };
                    return (
                      <div
                        ref={ref as unknown as React.Ref<HTMLDivElement>}
                        // className={cn(customClassName)}
                        className="z-30 rounded-full md:w-16 md:h-16 max-md:w-12 max-md:h-12 max-md:text-xs flex justify-center items-center border border-primary bg-white overflow-hidden"
                        style={style}
                      >
                        {assigned.attendance.player?.user?.name ||
                          assigned.attendance.mercenary?.user?.name ||
                          assigned.attendance.mercenary?.name ||
                          ""}
                      </div>
                    );
                  }}
                />
              )}
              {positions.map((position) => {
                return (
                  <DropDiv
                    layoutId={position.assigned?.id}
                    key={[position.key, position.assigned?.id].join("-")}
                    canDrop={({ item }: { item: typeof position.assigned }) =>
                      item?.position !== position.assigned?.position
                    }
                    onDrop={handlePositionChange(position.key)}
                    className={cn(
                      "absolute z-20 md:-ml-8 md:-mt-8 max-md:-ml-6 max-md:-mt-6",
                      position.className,
                      {
                        ["invisible"]: !(position.assigned || position.isFormation),
                      },
                    )}
                  >
                    {position.assigned ? (
                      <>
                        <DragButton
                          item={position.assigned}
                          variant={"ghost"}
                          onClick={handlePositionClick(position.key)}
                          className={({ isDragging }) => {
                            return cn(
                              "rounded-full md:w-16 md:h-16 max-md:w-12 max-md:h-12 max-md:text-xs flex justify-center items-center border border-primary bg-white shadow-md",
                              {
                                // ["outline outline-primary"]: position.assigned,
                                ["opacity-50"]: isDragging,
                              },
                            );
                          }}
                        >
                          {position.assigned
                            ? position.assigned.attendance.player?.user?.name ||
                              position.assigned.attendance.mercenary?.user?.name ||
                              position.assigned.attendance.mercenary?.name
                            : position.key}
                        </DragButton>
                      </>
                    ) : (
                      <Button
                        onClick={handlePositionClick(position.key)}
                        variant={"ghost"}
                        className={cn(
                          "rounded-full md:w-16 md:h-16 max-md:w-12 max-md:h-12 max-md:text-xs w-full h-full flex justify-center items-center bg-white shadow-md",
                        )}
                      >
                        {position.key}
                      </Button>
                    )}
                    {/* </PositionSettingDrawer> */}
                  </DropDiv>
                );
              })}

              <PositionSettingDrawer
                positionType={selectedPositionType}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
              ></PositionSettingDrawer>
            </DndProvider>
          </div>
        </section>
      </PositionSettingContext>
    </>
  );
};

export default PositionSettingPage;
