import { useNavigate, useOutletContext, useParams } from "@remix-run/react";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { HiClock, HiHome, HiLocationMarker } from "react-icons/hi";
import { Fragment } from "react/jsx-runtime";
import ItemLink from "~/components/ItemLink";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { IMatchClubIdLayoutOutletContext } from "./_layout";

interface IMatchClubIdPageProps {}

const MatchClubIdPage = (_props: IMatchClubIdPageProps) => {
  const data = useOutletContext<IMatchClubIdLayoutOutletContext>();
  const params = useParams();
  const navigate = useNavigate();
  const [selectedMatchClubId, setSelectedMatchClubId] = useState<string>("");
  const match = data.match;
  const matchClubs = match.matchClubs;
  useEffect(() => {
    if (matchClubs.length > 0) {
      const selectedId = params?.matchClubId || "";
      setSelectedMatchClubId(selectedId);
    }
  }, [matchClubs, params]);

  const handleSelectedMatchClubIdChange = (id: string) => {
    navigate(`/matches/${params.id}/clubs/${id}`);
    setSelectedMatchClubId(id);
  };
  return (
    <>
      {/* 매치정보 Card */}
      <Card>
        <div className="flex justify-between">
          <div>
            <CardHeader>
              {/* 오른쪽: 매치 제목/설명 */}
              <div className="">
                <CardTitle className="text-base sm:text-lg">
                  {match.title}
                </CardTitle>
                <CardDescription className="">
                  {match.description}
                </CardDescription>
              </div>
              {/* 왼쪽: 클럽 정보 */}
            </CardHeader>
            <CardContent>
              <div className="flex justify-between max-sm:flex-col gap-2">
                <div>
                  <p className="flex items-center gap-2 ">
                    <HiLocationMarker className="text-base text-primary" />
                    <span className="text-foreground text-sm">
                      {match.placeName}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <HiHome className="text-base text-primary" />
                    <span className="text-foreground text-sm">
                      {match.address}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <HiClock className="text-base text-primary" />
                    <span className="text-foreground text-sm">
                      {dayjs(match.stDate).format("YYYY-MM-DD (ddd) HH:mm")}
                    </span>
                  </p>
                </div>
                <div className="flex items-end"></div>
              </div>
            </CardContent>
          </div>
          <div className="px-6 max-sm:min-w-40 sm:min-w-72 flex flex-col justify-center items-center gap-2">
            <div className="flex items-center space-x-2">
              {matchClubs.map((matchClub, i) => (
                <Fragment key={matchClub.id}>
                  {i !== 0 && (
                    <div className="flex whitespace-nowrap items-center text-sm font-semibold">
                      <span className="text-primary">vs</span>
                    </div>
                  )}
                  <div className="flex whitespace-nowrap items-center text-sm font-semibold gap-1">
                    <ItemLink
                      to={`/matches/${params.id}/clubs/${matchClub.id}`}
                      className="flex gap-x-2 items-center"
                    >
                      <Avatar>
                        <AvatarImage
                          src={
                            matchClub.club?.emblem?.url ??
                            "/images/club-default-emblem.webp"
                          }
                        />
                        <AvatarFallback className="bg-primary">
                          <Loading />
                        </AvatarFallback>
                      </Avatar>
                      <span>{matchClub.club?.name}</span>
                    </ItemLink>
                  </div>
                </Fragment>
              ))}
            </div>
            <Select
              value={selectedMatchClubId}
              onValueChange={handleSelectedMatchClubIdChange}
            >
              <SelectTrigger className="min-w-24 max-w-52">
                <SelectValue placeholder="클럽 선택" />
              </SelectTrigger>
              <SelectContent>
                {matchClubs.map((matchClub) => (
                  <SelectItem key={matchClub.id} value={matchClub.id}>
                    {matchClub.club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </>
  );
};

export default MatchClubIdPage;
