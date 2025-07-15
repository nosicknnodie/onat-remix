import { ComponentProps } from "react";
import { cn } from "~/libs/utils";

interface IMainInnerProps extends ComponentProps<"div"> {}

const MainInner = ({ className, ..._props }: IMainInnerProps) => {
  return (
    <>
      <div
        className={cn(
          "flex-1 min-w-0 flex justify-start flex-col max-w-screen-lg w-full",
          className
        )}
        {..._props}
      />
    </>
  );
};

export default MainInner;
