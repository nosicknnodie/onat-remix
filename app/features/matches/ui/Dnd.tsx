import type { ComponentProps } from "react";
import DragButton from "~/components/dnd/DragButton";
import DropDiv from "~/components/dnd/DropDiv";

export function DraggableChip<TItem>(props: ComponentProps<typeof DragButton<TItem>>) {
  // thin wrapper to keep route decoupled from shared dnd components
  return <DragButton<TItem> {...props} />;
}

export function DropSpot<TItem>(props: ComponentProps<typeof DropDiv<TItem>>) {
  return <DropDiv<TItem> {...props} />;
}
