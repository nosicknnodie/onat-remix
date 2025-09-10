import { NavLink } from "@remix-run/react";
import type { ComponentProps } from "react";
import { cn } from "~/libs";

interface IItemLinkProps extends ComponentProps<typeof NavLink> {}
const ItemLink = ({ className, ..._props }: IItemLinkProps) => {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "text-foreground pb-1 relative incline-block font-semibold hover:text-primary",
          "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
          {
            "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
              isActive,
          },
          className,
        )
      }
      {..._props}
    />
  );
};

export default ItemLink;
