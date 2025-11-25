import { useParams } from "@remix-run/react";
import { FiEdit2 } from "react-icons/fi";
import { Loading } from "~/components/Loading";
import StarRating from "~/components/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/Link";
import { ClubPermissionGate } from "~/features/clubs/client";
import { useClubDetailsQuery, useClubYearStats } from "~/features/clubs/isomorphic";

interface IClubPageProps {}

const RightComponent = () => {
  const { clubId } = useParams();
  return (
    <>
      <ClubPermissionGate permission="CLUB_MANAGE">
        <Button asChild variant="secondary" className="h-6 gap-1">
          <Link to={`/clubs/${clubId}/edit`}>
            <FiEdit2 className="size-3.5" />
            클럽 수정
          </Link>
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
  const { data: stats } = useClubYearStats(clubId, new Date().getFullYear());
  if (!club) {
    return null;
  }
  return (
    <>
      <div className="rounded-lg overflow-hidden shadow relative">
        <img
          src={club?.image?.url || "/images/club-default-image.webp"}
          alt="대표 이미지"
          className="w-full h-52 object-cover"
        />
        <div className="p-2 flex items-center gap-2 absolute bottom-2 right-2">
          <div className="flex flex-col gap-1 items-center">
            <div className="text-2xl font-semibold bg-black/20 hover:bg-black/50 p-2 rounded-lg text-white text-center flex gap-2 items-center">
              <Avatar className="size-6">
                <AvatarImage src={club?.emblem?.url || "/images/club-default-emblem.webp"} />
                <AvatarFallback className="bg-primary">
                  <Loading />
                </AvatarFallback>
              </Avatar>
              {club.name}
            </div>
            <div className="text-xs font-semibold flex gap-1">
              <Badge className="bg-primary/30">{club.si || "-"}</Badge>
              <Badge className="bg-primary/30">{club.gun || "-"}</Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="grid w-full md:grid-cols-2 gap-2">
        {/** 여기가 랭킹 */}
        <div className="w-full">
          {/** 탭 (평점, 좋아요, 골)*/}
          <p className="font-semibold drop-shadow-md text-center">
            This year's Rank (출석률 25% 이상)
          </p>
          <div className="w-full rounded-lg px-4">
            {stats
              ?.sort((a, b) => b.averageRating - a.averageRating)
              .filter((_, index) => index < 11)
              .map((item, index) => (
                <div
                  key={item.playerId}
                  className="flex justify-between gap-2 text-sm rounded-3xl px-2 py-1 hover:bg-primary/10 transform"
                >
                  <div className="flex gap-2 items-center">
                    <Avatar>
                      <AvatarImage
                        src={item.userImageUrl || "/images/user_empty.png"}
                      ></AvatarImage>
                      <AvatarFallback className="bg-white">
                        <Loading />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {index + 1}.{item.nick}
                    </div>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <StarRating id={item.playerId} score={item.averageRating} />
                    <div>{(item.averageRating / 20).toFixed(2)}/3</div>
                    {item.matchCount} 매치
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClubPage;
