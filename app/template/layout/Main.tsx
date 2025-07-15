import { ComponentProps } from "react";
import { cn } from "~/libs/utils";

interface IMainProps extends ComponentProps<"main"> {}

const Main = ({ className, ..._props }: IMainProps) => {
  return (
    <>
      <main
        className={cn(
          "mx-auto w-full max-w-screen-2xl p-4 md:p-6 lg:p-8 flex justify-center",
          className
        )}
        {..._props}
      />
    </>
  );
};

export default Main;
