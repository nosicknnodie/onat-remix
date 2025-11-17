import { useParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/Link";
import {
  ClubInfoAttendanceCard,
  ClubInfoMatchCard,
  ClubLeaderboardCard,
  ClubNoticeList,
  ClubPermissionGate,
} from "~/features/clubs/client";
import {
  useAttendanceQuery,
  useClubDetailsQuery,
  useGoalLeadersQuery,
  useNoticesQuery,
  useRatingLeadersQuery,
  useRecentMatchQuery,
  useUpcomingMatchQuery,
} from "~/features/clubs/isomorphic";

interface IClubPageProps {}

const RightComponent = () => {
  const { clubId } = useParams();
  return (
    <>
      <ClubPermissionGate permission="CLUB_MANAGE">
        <Button asChild variant="outline">
          <Link to={`/clubs/${clubId}/edit`}>클럽 수정</Link>
        </Button>
      </ClubPermissionGate>
    </>
  );
};

export const handle = { breadcrumb: "정보", right: RightComponent };

const ClubPage = (_props: IClubPageProps) => {
  const { clubId } = useParams();
  if (!clubId) {
    throw new Error("clubId is missing from route params");
  }

  const { data: club } = useClubDetailsQuery(clubId);
  const { data: recentMatch } = useRecentMatchQuery(clubId);
  const { data: upcomingMatch } = useUpcomingMatchQuery(clubId);
  const { data: attendance } = useAttendanceQuery(clubId);
  const { data: goalLeaders } = useGoalLeadersQuery(clubId);
  const { data: ratingLeaders } = useRatingLeadersQuery(clubId);
  const { data: notices } = useNoticesQuery(clubId);

  if (!club) {
    return null;
  }

  const attendanceData = attendance ?? {
    total: 0,
    voted: 0,
    checkedIn: 0,
    voteRate: 0,
    checkRate: 0,
  };

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
            match={recentMatch ?? null}
            emptyMessage="최근 경기가 없습니다."
          />
          <ClubInfoMatchCard
            title="다가올 경기"
            match={upcomingMatch ?? null}
            emptyMessage="예정된 경기가 없습니다."
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <ClubInfoAttendanceCard attendance={attendanceData} />
          <ClubLeaderboardCard
            title="올해 득점 TOP5"
            description="자책골은 제외합니다"
            items={goalLeaders ?? []}
            emptyMessage="득점 데이터가 없습니다."
            valueSuffix="골"
          />
          <ClubLeaderboardCard
            title="올해 평점 TOP5"
            description="평점은 3점 만점 기준"
            items={ratingLeaders ?? []}
            emptyMessage="평점 데이터가 없습니다."
            valueSuffix="점"
          />
        </div>
        <ClubNoticeList clubId={club.id} notices={notices ?? []} />
      </div>
    </>
  );
};

export default ClubPage;
