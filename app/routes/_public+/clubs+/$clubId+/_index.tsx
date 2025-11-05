import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import type { ClubInfoData } from "~/features/clubs";
import {
  ClubInfoAttendanceCard,
  ClubInfoMatchCard,
  ClubLeaderboardCard,
  ClubNoticeList,
} from "~/features/clubs";
import { service as clubService } from "~/features/clubs/index.server";
import type { IClubLayoutLoaderData } from "./_layout";

interface IClubPageProps {}

export const handle = { breadcrumb: "정보" };

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const clubId = params.clubId;
  if (!clubId) {
    throw new Response("Club not found", { status: 404 });
  }
  const data = await clubService.getClubInfoData(clubId);
  return json(data satisfies ClubInfoData);
};

const ClubPage = (_props: IClubPageProps) => {
  const info = useLoaderData<typeof loader>();
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
              지역: {club.si || "-"} {club.gun || "-"} / {club.isPublic ? "공개" : "비공개"}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <ClubInfoMatchCard
            title="최근 경기"
            match={info.recentMatch}
            emptyMessage="최근 경기가 없습니다."
          />
          <ClubInfoMatchCard
            title="다가올 경기"
            match={info.upcomingMatch}
            emptyMessage="예정된 경기가 없습니다."
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <ClubInfoAttendanceCard attendance={info.attendance} />
          <ClubLeaderboardCard
            title="올해 득점 TOP5"
            description="자책골은 제외합니다"
            items={info.goalLeaders}
            emptyMessage="득점 데이터가 없습니다."
            valueSuffix="골"
          />
          <ClubLeaderboardCard
            title="올해 평점 TOP5"
            description="평점은 3점 만점 기준"
            items={info.ratingLeaders}
            emptyMessage="평점 데이터가 없습니다."
            valueSuffix="점"
          />
        </div>
        <ClubNoticeList clubId={club.id} notices={info.notices} />
      </div>
    </>
  );
};

export default ClubPage;
