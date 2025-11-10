import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Link } from "~/components/ui/Link";
import { cn } from "~/libs";

interface ClubAdminMenuProps {
  isAdmin: boolean;
  editHref: string;
  isSelf?: boolean;
  onToggleSelf?: () => void | Promise<void>;
  disabled?: boolean;
}

export const ClubAdminMenu = ({
  isAdmin,
  editHref,
  isSelf,
  onToggleSelf,
  disabled,
}: ClubAdminMenuProps) => {
  if (!isAdmin) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 w-8 p-0 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0",
          )}
          disabled={disabled}
        >
          <span className="sr-only">Open menu</span>
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={editHref}>매치 수정</Link>
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem checked={!!isSelf} onClick={() => onToggleSelf?.()}>
          자체전 여부
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
