import { motion } from "framer-motion";
import type React from "react";
import type { ComponentPropsWithoutRef, ComponentRef, Ref } from "react";
import { Button } from "~/components/ui/button";

export type PositionAssigned = {
  id: string;
  name: string;
  className: string;
  color?: string;
};

export function PositionBoard({
  headerLeft,
  headerRight,
  assigned,
}: {
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  assigned: PositionAssigned[];
}) {
  return (
    <section>
      <div className="w-full overflow-hidden max-md:pb-[154.41%] md:pb-[64.76%] relative">
        <div className="absolute top-0 left-0 w-full h-full z-10 max-md:bg-[url('/images/test-vertical.svg')] md:bg-[url('/images/test.svg')] bg-cover bg-center" />
        {headerLeft}
        {headerRight}
        {assigned.map((item) => (
          <MotionButton
            layoutId={item.id}
            key={item.id}
            variant="ghost"
            style={{ borderColor: item.color }}
            className={
              "absolute overflow-hidden z-20 hover:z-30 focus-visible:z-30 rounded-full md:w-16 md:-ml-8 md:-mt-8 md:h-16 max-md:-ml-6 max-md:-mt-6 max-md:w-12 max-md:h-12 max-md:text-xs flex justify-center items-center border bg-white shadow-md " +
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
