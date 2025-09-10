import type { ComponentProps } from "react";
import { useDrag } from "react-dnd";
import { cn } from "~/libs";
import { Button } from "../ui/button";

interface IDragButtonProps<TItem> extends Omit<ComponentProps<typeof Button>, "className"> {
  item?: TItem;
  className?: (({ isDragging }: { isDragging: boolean }) => string) | string;
}

const DragButton = <TItem,>({ className, item, ...props }: IDragButtonProps<TItem>) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "item", // 드래그 아이템의 타입 설정
    item, // 드래그 시 전송될 아이템 데이터 설정
    collect: (monitor) => ({
      isDragging: monitor.isDragging(), // 드래그 중인지 여부를 수집
    }),
  });
  const customClassName = className
    ? typeof className === "string"
      ? className
      : className({ isDragging })
    : "";
  // useEffect(() => {
  //   // previewRef에 빈 이미지를 지정하여 기본 ghost image 제거
  //   previewRef(getEmptyImage(), { captureDraggingState: true });
  // }, [previewRef]);

  return (
    <>
      <Button
        ref={
          // (previewRef as unknown as React.Ref<HTMLButtonElement>) ||
          dragRef as unknown as React.Ref<HTMLButtonElement>
        }
        className={cn(customClassName)}
        {...props}
      />
    </>
  );
};

export default DragButton;
