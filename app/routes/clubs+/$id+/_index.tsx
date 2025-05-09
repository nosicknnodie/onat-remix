import { useOutletContext } from "@remix-run/react";
import { IClubLayoutLoaderData } from "./_layout";
interface IClubPageProps {}

export const handle = { breadcrumb: "정보" };

const ClubPage = (_props: IClubPageProps) => {
  const { club } = useOutletContext<IClubLayoutLoaderData>();

  return (
    <>
      <div className="rounded-lg overflow-hidden shadow border">
        <img
          src={club?.image?.url || "/images/club-default-image.webp"}
          alt="대표 이미지"
          className="w-full h-52 object-cover"
        />
        <div className="p-6 flex items-start gap-4">
          <img
            src={club?.emblem?.url || "/images/club-default-emblem.webp"}
            alt="엠블럼"
            className="w-16 h-16 object-cover rounded-full border"
          />
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">{club.name}</h2>
            <p className="text-muted-foreground text-sm">
              {club.description || "클럽 소개가 없습니다."}
            </p>
            <p className="text-xs text-gray-500">
              지역: {club.si || "-"} {club.gun || "-"} /{" "}
              {club.isPublic ? "공개" : "비공개"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClubPage;
