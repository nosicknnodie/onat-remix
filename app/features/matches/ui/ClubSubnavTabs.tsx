import { Link } from "~/components/ui/Link";
import { cn } from "~/libs/utils";

export type ClubSubnavItem = {
  label: string;
  href: string;
  active?: boolean;
};

interface ClubSubnavTabsProps {
  items: ClubSubnavItem[];
  className?: string;
}

export const ClubSubnavTabs = ({ items, className }: ClubSubnavTabsProps) => {
  return (
    <div className={cn("flex gap-x-4 p-2", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            "text-foreground pb-1 relative incline-block font-semibold hover:text-primary",
            "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
            item.active &&
              "text-primary font-bold after:absolute after:-right-0 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};
