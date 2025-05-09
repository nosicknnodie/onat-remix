import { Club, File } from "@prisma/client";
import { NavLink } from "@remix-run/react";
import { ComponentProps } from "react";
import { cn } from "~/libs/utils";

interface IClubTabProps {
  club: Club & { image?: File | null; emblem?: File | null };
}

const ClubTab = ({ club }: IClubTabProps) => {
  return (
    <>
      <div className="flex gap-6 px-4 text-base w-full">
        <ItemLink to={`/clubs/${club.id}`} end>
          정보
        </ItemLink>
        <ItemLink to={`/clubs/${club.id}/members`}>멤버</ItemLink>
        <ItemLink to={`/clubs/${club.id}/matches`}>매치</ItemLink>
        <ItemLink to={`/clubs/${club.id}/pendings`}>승인대기</ItemLink>
      </div>
    </>
  );
};

interface IItemLinkProps extends ComponentProps<typeof NavLink> {}
const ItemLink = ({ className, ..._props }: IItemLinkProps) => {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "text-gray-600 pb-1 relative incline-block font-semibold",
          "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
          {
            "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
              isActive,
          },
          className
        )
      }
      {..._props}
    />
  );
};

export default ClubTab;
