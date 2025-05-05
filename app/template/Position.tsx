import { PositionType } from "@prisma/client";
import { ToggleGroupItemProps } from "@radix-ui/react-toggle-group";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { cn } from "~/libs/utils";

const positions = [
  {
    children: "LS",
    className:
      "md:left-[75%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[25%]",
  },
  {
    children: "ST",
    className: "md:left-[75%] md:top-[50%] max-md:left-[50%] max-md:top-[25%]",
  },
  {
    children: "RS",
    className:
      "md:left-[75%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[25%]",
  },
  {
    children: "LW",
    className:
      "md:left-[65%] md:top-[16.6%] max-md:left-[16.6%] max-md:top-[35%]",
  },
  {
    children: "LF",
    className:
      "md:left-[65%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[35%]",
  },
  {
    children: "CF",
    className: "md:left-[65%] md:top-[50%] max-md:left-[50%] max-md:top-[35%]",
  },
  {
    children: "RF",
    className:
      "md:left-[65%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[35%]",
  },
  {
    children: "RW",
    className:
      "md:left-[65%] md:top-[83.4%] max-md:left-[83.4%] max-md:top-[35%]",
  },
  {
    children: "LAM",
    className:
      "md:left-[55%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[45%]",
  },
  {
    children: "CAM",
    className: "md:left-[55%] md:top-[50%] max-md:left-[50%] max-md:top-[45%]",
  },
  {
    children: "RAM",
    className:
      "md:left-[55%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[45%]",
  },

  {
    children: "LM",
    className:
      "md:left-[45%] md:top-[16.6%] max-md:left-[16.6%] max-md:top-[55%]",
  },
  {
    children: "LCM",
    className:
      "md:left-[45%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[55%]",
  },
  {
    children: "CM",
    className: "md:left-[45%] md:top-[50%] max-md:left-[50%] max-md:top-[55%]",
  },
  {
    children: "RCM",
    className:
      "md:left-[45%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[55%]",
  },
  {
    children: "RM",
    className:
      "md:left-[45%] md:top-[83.4%] max-md:left-[83.4%] max-md:top-[55%]",
  },
  {
    children: "LWB",
    className:
      "md:left-[35%] md:top-[16.6%] max-md:left-[16.6%] max-md:top-[65%]",
  },
  {
    children: "LDM",
    className:
      "md:left-[35%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[65%]",
  },
  {
    children: "DM",
    className: "md:left-[35%] md:top-[50%] max-md:left-[50%] max-md:top-[65%]",
  },
  {
    children: "RDM",
    className:
      "md:left-[35%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[65%]",
  },
  {
    children: "RWB",
    className:
      "md:left-[35%] md:top-[83.4%] max-md:left-[83.4%] max-md:top-[65%]",
  },
  {
    children: "LB",
    className: "md:left-[25%] md:top-[20%] max-md:left-[20%] max-md:top-[75%]",
  },
  {
    children: "LCB",
    className: "md:left-[25%] md:top-[35%] max-md:left-[35%] max-md:top-[75%]",
  },
  {
    children: "SW",
    className: "md:left-[20%] md:top-[50%] max-md:left-[50%] max-md:top-[80%]",
  },
  {
    children: "RCB",
    className: "md:left-[25%] md:top-[65%] max-md:left-[65%] max-md:top-[75%]",
  },
  {
    children: "RB",
    className: "md:left-[25%] md:top-[80%] max-md:left-[80%] max-md:top-[75%]",
  },
  {
    children: "GK",
    className: "md:left-[10%] md:top-[50%] max-md:left-[50%] max-md:top-[90%]",
  },
];

interface IPositionProps {
  defaultValue?: string[] | undefined;
  value: string[] | undefined;
  isPending?: boolean;
  onValueChange?: (v: PositionType[] | undefined) => void;
}

const Position = ({
  value,
  defaultValue,
  onValueChange,
  isPending,
}: IPositionProps) => {
  const [positionValues, setPositionValues] = useState<string[] | undefined>(
    defaultValue
  );
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
          ></img>
          <ToggleGroup
            type="multiple"
            onValueChange={handleAddPosition}
            value={positionValues}
            disabled={isPending}
          >
            {positions.map((v) => (
              <PositionItem
                className={v.className}
                key={v.children}
                value={v.children}
                disabled={isPending}
              >
                <div className="relative w-16 h-16 flex justify-center items-center">
                  {positionValues?.includes(v.children) && (
                    <div
                      className={cn(
                        "absolute left-4 -top-1 rounded-full w-5 h-5 p-2.5 bg-primary text-primary-foreground border-2 border-primary flex justify-center items-center",
                        { "bg-secondary-foreground": isPending }
                      )}
                    >
                      {positionValues.findIndex((p) => p === v.children) + 1}
                    </div>
                  )}
                  {v.children}
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
          ></img>
          <ToggleGroup
            type="multiple"
            onValueChange={handleAddPosition}
            value={positionValues}
            disabled={isPending}
          >
            {positions.map((v) => (
              <PositionItem
                className={v.className}
                key={v.children}
                value={v.children}
                disabled={isPending}
              >
                <div className="relative w-16 h-16 flex justify-center items-center">
                  {positionValues?.includes(v.children) && (
                    <div
                      className={cn(
                        "absolute left-4 -top-1 rounded-full w-5 h-5 p-2.5 bg-primary text-primary-foreground border-2 border-primary flex justify-center items-center",
                        { "bg-secondary-foreground": isPending }
                      )}
                    >
                      {positionValues.findIndex((p) => p === v.children) + 1}
                    </div>
                  )}
                  {v.children}
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
        "absolute rounded-full -translate-x-1/2 -translate-y-1/2 md:w-16 md:p-8 max-md:w-12 max-md:p-6 font-bold border-2 bg-white",
        className
      )}
      // variant="outline"
      {...props}
    />
  );
};

export default Position;
