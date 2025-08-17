/* eslint-disable jsx-a11y/heading-has-content */
import { ComponentProps } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { cn } from "~/libs/utils";

export const AttendanceGroupCard = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div
    className={cn(
      "p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 bg-white space-y-2",
      className
    )}
    {...props}
  />
);

export const AttendanceGroupCardHeader = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div
    className={cn("flex items-center justify-between", className)}
    {...props}
  />
);

export const AttendanceGroupCardTitle = ({
  className,
  ...props
}: ComponentProps<"h3">) => (
  <h3
    className={cn("font-semibold text-sm flex items-center gap-1", className)}
    {...props}
  />
);

export const AttendanceGroupCardContent = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div
    className={cn(
      "grid max-md:grid-cols-3 md:max-xl:grid-cols-2 xl:grid-cols-3 gap-2",
      className
    )}
    {...props}
  />
);

export const AttendanceGroupCardItem = ({
  className,
  children,
  isChecked,
  ...props
}: ComponentProps<"div"> & { isChecked?: boolean }) => (
  <div
    className={cn(
      "text-sm border px-3 py-1 rounded-lg bg-white relative text-center",
      className
    )}
    {...props}
  >
    <span className="line-clamp-1 break-words">{children}</span>
    {isChecked && (
      <FaCheckCircle className="text-green-500 text-sm ml-1 absolute -top-1 -right-1 bg-white" />
    )}
  </div>
);
