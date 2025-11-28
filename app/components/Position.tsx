/** biome-ignore-all lint/complexity/useIndexOf: off */
import type { PositionType } from "@prisma/client";
import type { ToggleGroupItemProps } from "@radix-ui/react-toggle-group";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { cn, PORMATION_POSITION_CLASSNAME } from "~/libs/isomorphic";

interface IPositionProps {
  defaultValue?: string[] | undefined;
  value: string[] | undefined;
  isPending?: boolean;
  onValueChange?: (v: PositionType[] | undefined) => void;
  scale?: "normal" | "compact";
}

const Position = ({
  value,
  defaultValue,
  onValueChange,
  isPending,
  scale = "normal",
}: IPositionProps) => {
  const [positionValues, setPositionValues] = useState<string[] | undefined>(defaultValue);
  useEffect(() => {
    setPositionValues(value);
  }, [value]);

  const handleAddPosition = (v: string[] | undefined) => {
    if (v) {
      if (v.length > 3) {
        toast.info("포지션은 3개 까지만 가능합니다.");
        return false;
      }
      onValueChange?.(v as PositionType[] | undefined);
      setPositionValues(v);
    }
  };

  const circleSizeClass =
    scale === "compact"
      ? "md:w-12 md:p-6 max-md:w-8 max-md:p-5"
      : "md:w-16 md:p-8 max-md:w-8 max-md:p-5";
  const badgeSizeClass =
    scale === "compact"
      ? "left-3 -top-1 rounded-full w-4 h-4 p-2"
      : "left-4 -top-1 rounded-full w-5 h-5 p-2.5";

  return (
    <>
      <div className="py-4">
        <div className="w-full overflow-hidden pb-[154.41%] relative md:hidden">
          <img
            src={"/images/test-vertical.svg"}
            alt="soccer field"
            className="absolute top-0 left-0 w-full h-full"
          />
          <ToggleGroup
            type="multiple"
            onValueChange={handleAddPosition}
            value={positionValues}
            disabled={isPending}
          >
            {Object.entries(PORMATION_POSITION_CLASSNAME).map(([key, { className }]) => (
              <PositionItem
                className={className}
                key={key}
                value={key}
                disabled={isPending}
                sizeClassName={circleSizeClass}
              >
                <div className={cn("relative flex justify-center items-center", circleSizeClass)}>
                  {positionValues?.includes(key) && (
                    <div
                      className={cn(
                        "absolute bg-primary text-primary-foreground border-2 border-primary flex justify-center items-center",
                        badgeSizeClass,
                        { "bg-secondary-foreground": isPending },
                      )}
                    >
                      {positionValues.findIndex((p) => p === key) + 1}
                    </div>
                  )}
                  {key}
                </div>
              </PositionItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="w-full overflow-hidden pb-[64.76%] relative max-md:hidden">
          <img
            src={"/images/test.svg"}
            alt="soccer field"
            className="absolute top-0 left-0 w-full h-full"
          />
          <ToggleGroup
            type="multiple"
            onValueChange={handleAddPosition}
            value={positionValues}
            disabled={isPending}
          >
            {Object.entries(PORMATION_POSITION_CLASSNAME).map(([key, { className }]) => (
              <PositionItem
                className={className}
                key={key}
                value={key}
                disabled={isPending}
                sizeClassName={circleSizeClass}
              >
                <div className={cn("relative flex justify-center items-center", circleSizeClass)}>
                  {positionValues?.includes(key) && (
                    <div
                      className={cn(
                        "absolute bg-primary text-primary-foreground border-2 border-primary flex justify-center items-center",
                        badgeSizeClass,
                        { "bg-secondary-foreground": isPending },
                      )}
                    >
                      {positionValues.findIndex((p) => p === key) + 1}
                    </div>
                  )}
                  {key}
                </div>
              </PositionItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </>
  );
};

const PositionItem = ({
  className,
  sizeClassName,
  ...props
}: ToggleGroupItemProps & { sizeClassName: string }) => {
  return (
    <ToggleGroupItem
      className={cn(
        "absolute rounded-full -translate-x-1/2 -translate-y-1/2 font-bold border-2 bg-white",
        sizeClassName,
        className,
      )}
      {...props}
    />
  );
};

export default Position;
