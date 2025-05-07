import { Club, File } from "@prisma/client";
import { NavLink } from "@remix-run/react";
import { cn } from "~/libs/utils";

interface IClubTabProps {
  club: Club & { image?: File | null; emblem?: File | null };
}

const ClubTab = ({ club }: IClubTabProps) => {
  return (
    <>
      <div className="flex gap-6 px-4 text-base w-full">
        <NavLink
          to={`/clubs/${club.id}`}
          className={({ isActive }) =>
            cn(
              "text-gray-600 pb-1 relative incline-block font-semibold",
              "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
              {
                "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
                  isActive,
              }
            )
          }
          end
        >
          정보
        </NavLink>
        <NavLink
          to={`/clubs/${club.id}/members`}
          className={({ isActive }) =>
            cn(
              "text-gray-600 pb-1 relative incline-block font-semibold",
              "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
              {
                "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
                  isActive,
              }
            )
          }
        >
          멤버
        </NavLink>
        <NavLink
          to={`/clubs/${club.id}/matches`}
          className={({ isActive }) =>
            cn(
              "text-gray-600 pb-1 relative incline-block font-semibold",
              "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
              {
                "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
                  isActive,
              }
            )
          }
        >
          매치
        </NavLink>
      </div>
    </>
  );
};

export default ClubTab;
