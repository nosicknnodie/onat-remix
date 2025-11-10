import { Link } from "~/components/ui/Link";
import { cn } from "~/libs";

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
    <div className={cn("flex flex-wrap gap-2", className)}>
      <nav
        aria-label="Match navigation"
        className="flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1"
      >
        {items.map((item) => {
          const isActive = !!item.active;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group relative flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
              )}
            >
              <span>{item.label}</span>
              <span
                className={cn(
                  "pointer-events-none absolute inset-x-2 bottom-1 h-1 rounded-full bg-primary/40 transition-opacity",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                )}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
