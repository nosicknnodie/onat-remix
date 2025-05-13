import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { ComponentProps } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/libs/utils";

export const AttendanceGroupCard = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn(
      "p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 bg-white space-y-2",
      className,
    )}
    {...props}
  />
);

export const AttendanceGroupCardHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex items-center justify-between", className)} {...props} />
);

export const AttendanceGroupCardTitle = ({ className, ...props }: ComponentProps<"h3">) => (
  <h3 className={cn("font-semibold text-sm flex items-center gap-1", className)} {...props} />
);

export const AttendanceGroupCardContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex flex-wrap gap-2", className)} {...props} />
);

export const AttendanceGroupCardItem = ({
  className,
  children,
  isChecked,
  ...props
}: ComponentProps<"div"> & { isChecked?: boolean }) => (
  <div
    className={cn("text-sm border px-3 py-1 rounded-full bg-white relative", className)}
    {...props}
  >
    {isChecked && (
      <FaCheckCircle className="text-green-500 text-sm ml-1 absolute -top-1 -right-1 bg-white" />
    )}
    {children}
  </div>
);

export const AttendanceAddMercenaryAction = () => {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
            // disabled={isPending}
          >
            <span className="sr-only">Open menu</span>
            {/* {isPending ? (
                <Loading />
                ) : (
                  )} */}
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>+ 용병추가</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
