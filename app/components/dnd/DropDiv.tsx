import { motion } from "framer-motion";
import { ComponentProps } from "react";
import { useDrop } from "react-dnd";
import { cn } from "~/libs/utils";
interface IDropDivProps<TItem> extends Omit<ComponentProps<typeof motion.div>, "onDrop"> {
  canDrop?: ({ item }: { item: TItem }) => boolean;
  onDrop?: (value: TItem) => void;
}

const DropDiv = <TItem,>({ canDrop, onDrop, className, ..._props }: IDropDivProps<TItem>) => {
  const [{ isDragging, isOver, canDrop: _canDrop }, dropRef] = useDrop<
    TItem,
    unknown,
    { isOver: boolean; canDrop: boolean; isDragging: boolean }
  >(
    () => ({
      accept: "item",
      canDrop: (item: TItem) => canDrop?.({ item }) ?? false,
      drop: (value, monitor) => {
        monitor.isOver() && monitor.canDrop() && onDrop?.(value);
      },
      collect: (monitor) => ({
        isDragging: !!monitor.getItem(),
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [],
  );
  return (
    <>
      <motion.div
        ref={dropRef as unknown as React.Ref<HTMLDivElement>}
        className={cn(className, {
          "outline outline-primary rounded-full": isOver && _canDrop,
          ["visible opacity-30"]: isDragging,
        })}
        {..._props}
      />
    </>
  );
};

export default DropDiv;
