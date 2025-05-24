import { Prisma } from "@prisma/client";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useRevalidator, useSearchParams } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai/react";
import { atomWithStorage } from "jotai/utils";
import { Fragment, useState, useTransition } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
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
} from "~/libs/const/position.const";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";

type QuarterWithAssigneds = Prisma.QuarterGetPayload<{
  include: {
    assigneds: {
      include: {
        team: true;
        attendance: {
          include: {
            mercenary: {
              include: {
                user: {
                  include: {
                    userImage: true;
                  };
                };
              };
            };
            player: {
              include: {
                user: {
                  include: {
                    userImage: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId!;
  const matchClub = await prisma.matchClub.findUnique({
    where: {
      id: matchClubId,
    },
    include: {
      quarters: { include: { team1: true, team2: true } },
      teams: true,
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
  const { revalidate } = useRevalidator();
  const matchClub = loaderData.matchClub;
  const [currentQuarterOrder, setCurrentQuarterOrder] = useState(
    Number(searchParams.get("quarter")) || 1,
  );
  const currentQuarter = matchClub.quarters.find(
    (quarter) => quarter.order === currentQuarterOrder,
  );
  const [currentTeamId, setCurrentTeamId] = useState(
    searchParams.get("teamId") || matchClub.teams[0].id || "",
  );
  const [isLoading, startTransition] = useTransition();

  const { data } = useQuery<{ quarter: QuarterWithAssigneds }>({
    queryKey: ["MATCH_POSITION_SETTING_QUARTER", currentQuarter?.id],
    queryFn: async () => {
      if (!currentQuarter) return null;
      return fetch("/api/quarters/" + currentQuarter.id).then((res) => res.json());
    },
  });
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

  const formationPositions = PORMATION_POSITIONS[positionTemplate].map((position) => {
    const className = PORMATION_POSITION_CLASSNAME[position].className;
    const assigned = data?.quarter.assigneds.find((assigned) => assigned.position === position);
    return {
      key: position,
      className,
      assigned,
    };
  });
  return (
    <>
      {/* <div>
        <h3>포지션 수정</h3>
        <div>쿼터</div>
        <div>팀 및 유니폼 색상</div>
        <div>기본 템플릿</div>
      </div> */}
      <section className="flex justify-between items-center">
        <div className="min-w-24">
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
          {formationPositions.map((position) => {
            return (
              <Fragment key={position.key}>
                <div
                  className={cn(
                    "absolute z-20 -translate-x-1/2 -translate-y-1/2",
                    position.className,
                  )}
                >
                  {position.assigned
                    ? position.assigned.attendance.player?.user?.name ||
                      position.assigned.attendance.mercenary?.user?.name
                    : position.key}
                </div>
              </Fragment>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default PositionSettingPage;
