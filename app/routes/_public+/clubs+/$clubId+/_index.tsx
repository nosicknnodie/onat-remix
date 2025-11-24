import { useParams } from "@remix-run/react";
import { FiEdit2 } from "react-icons/fi";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/Link";
import { ClubPermissionGate } from "~/features/clubs/client";
import { useClubDetailsQuery } from "~/features/clubs/isomorphic";

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

  if (!club) {
    return null;
  }

  return (
    <>
      <div className="rounded-lg overflow-hidden shadow border relative">
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
    </>
  );
};

export default ClubPage;
