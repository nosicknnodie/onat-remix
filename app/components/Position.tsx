/** biome-ignore-all lint/complexity/useIndexOf: off */
import type { PositionType } from "@prisma/client";
import type { ToggleGroupItemProps } from "@radix-ui/react-toggle-group";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { PORMATION_POSITION_CLASSNAME } from "~/libs/const/position.const";
import { cn } from "~/libs/utils";

interface IPositionProps {
  defaultValue?: string[] | undefined;
  value: string[] | undefined;
  isPending?: boolean;
  onValueChange?: (v: PositionType[] | undefined) => void;
}

const Position = ({ value, defaultValue, onValueChange, isPending }: IPositionProps) => {
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
              <PositionItem className={className} key={key} value={key} disabled={isPending}>
                <div className="relative w-16 h-16 flex justify-center items-center">
                  {positionValues?.includes(key) && (
                    <div
                      className={cn(
                        "absolute left-4 -top-1 rounded-full w-5 h-5 p-2.5 bg-primary text-primary-foreground border-2 border-primary flex justify-center items-center",
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
              <PositionItem className={className} key={key} value={key} disabled={isPending}>
                <div className="relative w-16 h-16 flex justify-center items-center">
                  {positionValues?.includes(key) && (
                    <div
                      className={cn(
                        "absolute left-4 -top-1 rounded-full w-5 h-5 p-2.5 bg-primary text-primary-foreground border-2 border-primary flex justify-center items-center",
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

const PositionItem = ({ className, ...props }: ToggleGroupItemProps) => {
  return (
    <ToggleGroupItem
      className={cn(
        "absolute rounded-full -translate-x-1/2 -translate-y-1/2 md:w-16 md:p-8 max-md:w-8 max-md:p-5 font-bold border-2 bg-white",
        className,
      )}
      {...props}
    />
  );
};

export default Position;
