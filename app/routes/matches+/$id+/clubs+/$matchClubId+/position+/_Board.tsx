import { useLoaderData } from "@remix-run/react";
import { motion } from "framer-motion";
import { AiFillSkin } from "react-icons/ai";
import { Button } from "~/components/ui/button";
import { PORMATION_POSITION_CLASSNAME } from "~/libs/const/position.const";
import { cn } from "~/libs/utils";
import { Actions } from "./_Actions";
import { loader } from "./_index";
import { usePositionContext, usePositionUpdate } from "./_position.context";

export const Board = () => {
  const loaderData = useLoaderData<typeof loader>();
  const context = usePositionContext();
  const currentQuarterOrder = context?.currentQuarterOrder;
  const currentQuarter = loaderData.matchClub.quarters.find(
    (quarter) => quarter.order === currentQuarterOrder
  );
  const team1 = currentQuarter?.team1;
  const team2 = currentQuarter?.team2;

  const assigneds = context?.query.data?.attendances
    .flatMap((attendance) =>
      attendance.assigneds.map((assigned) => ({
        ...assigned,
        attendance,
      }))
    )
    .filter(
      (assigned) =>
        assigned.quarterId === currentQuarter?.id && assigned.position
    )
    .map((assigned) => {
      const isSelf = currentQuarter?.isSelf || loaderData.matchClub.isSelf;
      const { className, team1ClassName, team2ClassName } =
        PORMATION_POSITION_CLASSNAME[assigned.position];
      let _className = "";
      let _color = undefined;
      if (isSelf) {
        _className =
          assigned.teamId === team1?.id
            ? team1ClassName || ""
            : team2ClassName || "";
        _color = assigned.teamId === team1?.id ? team1?.color : team2?.color;
      } else {
        _className = className;
      }
      return {
        ...assigned,
        className: _className,
        color: _color,
      };
    });
  usePositionUpdate({
    url: `${loaderData.env.WS_SERVER_URL}/position?id=${currentQuarter?.id}`,
  });

  return (
    <>
      <section>
        <div className="w-full overflow-hidden max-md:pb-[154.41%] md:pb-[64.76%] relative">
          <div className="absolute top-0 left-0 w-full h-full z-10 max-md:bg-[url('/images/test-vertical.svg')] md:bg-[url('/images/test.svg')] bg-cover bg-center" />
          {team1 && (
            <Actions teamId={team1.id}>
              <Button
                variant={"outline"}
                className="z-20 absolute top-2 left-2 max-w-36 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none focus-visible:ring-0 focus-visible:outline-none"
              >
                <AiFillSkin color={team1?.color} className="drop-shadow mr-1" />
                {team1.name}
              </Button>
            </Actions>
          )}
          {team2 && (
            <Actions teamId={team2.id}>
              <Button
                variant={"outline"}
                className="z-20 absolute top-2 right-2 max-w-36 opacity-70 outline-none ring-0 shadow-none drop-shadow-none border-none focus-visible:ring-0 focus-visible:outline-none"
              >
                <AiFillSkin color={team2.color} className="drop-shadow mr-1" />
                {team2.name}
              </Button>
            </Actions>
          )}
          {assigneds?.map((assigned) => {
            const name =
              assigned.attendance.player?.user?.name ||
              assigned.attendance.mercenary?.user?.name ||
              assigned.attendance.mercenary?.name;
            return (
              <MotionButton
                layoutId={assigned.id}
                key={assigned.id}
                // item={position.assigned}
                variant={"ghost"}
                style={{ borderColor: assigned?.color }}
                // onClick={handlePositionClick(position.key)}
                className={cn(
                  "absolute overflow-hidden z-20 hover:z-30 focus-visible:z-30 rounded-full md:w-16 md:-ml-8 md:-mt-8 md:h-16 max-md:-ml-6 max-md:-mt-6 max-md:w-12 max-md:h-12 max-md:text-xs flex justify-center items-center border bg-white shadow-md",
                  {
                    "border-primary": !assigned.color,
                    // ["md:w-12 md:-ml-6 md:-mt-6 md:h-12 max-md:-ml-4 max-md:-mt-4 max-md:w-8 max-md:h-8"]: true,
                  },
                  // className,
                  assigned.className
                )}
              >
                {name}
              </MotionButton>
            );
          })}
        </div>
      </section>
    </>
  );
};
const MotionButton = motion.create(({ forwardedRef, ...props }: any) => (
  <Button ref={forwardedRef} {...props} />
));
