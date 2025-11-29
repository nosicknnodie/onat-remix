import { motion } from "framer-motion";
import type React from "react";
import type { ComponentPropsWithoutRef, ComponentRef, Ref } from "react";
import { Button } from "~/components/ui/button";

export type PositionAssigned = {
  id: string;
  name: string;
  className: string;
  color?: string;
  contrastColor?: string;
};

export type TeamInfo = {
  name: string;
  color?: string;
};

export function PositionBoard({
  headerLeft,
  headerRight,
  assigned,
  isSelf,
  team1,
  team2,
}: {
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  assigned: PositionAssigned[];
  isSelf?: boolean;
  team1?: TeamInfo;
  team2?: TeamInfo;
}) {
  return (
    <section>
      <div className="w-full overflow-hidden max-md:pb-[154.41%] md:pb-[64.76%] relative outline outline-2 outline-[#d4edda] rounded-lg">
        <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(0deg,#e8f5e9_0%,#e8f5e9_10%,#d4edda_10%,#d4edda_20%)] md:bg-[repeating-linear-gradient(90deg,#e8f5e9_0%,#e8f5e9_10%,#d4edda_10%,#d4edda_20%)]" />
        <div className="absolute top-0 left-0 w-full h-full z-10 max-md:bg-[url('/images/board-vertical.svg')] md:bg-[url('/images/board.svg')] bg-cover bg-center fill-white" />
        {isSelf && team2 && (
          <div
            className="absolute md:top-2 md:right-2 max-md:top-2 max-md:left-2 z-20 px-3 py-1.5 rounded-md font-bold text-sm md:text-base shadow-md"
            style={{
              backgroundColor: team2.color ? `${team2.color}dd` : "#00000033",
              color: team2.color ? "#ffffff" : "#000000",
            }}
          >
            {team2.name}
          </div>
        )}
        {isSelf && team1 && (
          <div
            className="absolute md:top-2 md:left-2 max-md:bottom-2 max-md:left-2 z-20 px-3 py-1.5 rounded-md font-bold text-sm md:text-base shadow-md"
            style={{
              backgroundColor: team1.color ? `${team1.color}dd` : "#00000033",
              color: team1.color ? "#ffffff" : "#000000",
            }}
          >
            {team1.name}
          </div>
        )}
        {headerLeft}
        {headerRight}
        {assigned.map((item) => (
          <MotionButton
            layoutId={item.id}
            key={item.id}
            variant="ghost"
            style={{
              borderColor: item.color,
              backgroundColor: item.color,
              color: item.contrastColor,
              opacity: 0.8,
            }}
            className={
              "absolute overflow-hidden z-20 hover:z-30 focus-visible:z-30 rounded-full md:w-16 md:-ml-8 md:-mt-8 md:h-16 max-md:-ml-6 max-md:-mt-6 max-md:w-12 max-md:h-12 max-md:text-xs flex justify-center items-center border shadow-md font-extrabold text-lg " +
              item.className
            }
          >
            {item.name}
          </MotionButton>
        ))}
      </div>
    </section>
  );
}

type MotionButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  forwardedRef?: Ref<ComponentRef<typeof Button>>;
};

const MotionButton = motion.create(({ forwardedRef, ...props }: MotionButtonProps) => (
  <Button ref={forwardedRef} {...props} />
));
