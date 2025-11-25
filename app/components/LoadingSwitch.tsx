import type { ReactNode } from "react";
import { cn } from "~/libs";
import { Skeleton } from "./ui/skeleton";

interface LoadingSwitchProps {
  isLoading?: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
  className?: string;
}

function LoadingSwitch({ isLoading = false, skeleton, children, className }: LoadingSwitchProps) {
  const fallback = skeleton ?? <Skeleton className="h-10 w-full" />;
  return <div className={cn(className)}>{isLoading ? fallback : children}</div>;
}

export { LoadingSwitch };
