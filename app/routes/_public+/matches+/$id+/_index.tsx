interface IMatchesIdPageProps {}

import { useNavigate, useOutletContext, useParams } from "@remix-run/react";
import { loader as layoutLoader } from "./_layout";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { HiClock, HiHome, HiLocationMarker } from "react-icons/hi";
import { Fragment } from "react/jsx-runtime";
import ItemLink from "~/components/ItemLink";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

/**
 * 축구 경기 매치 디테일 화면
 * 1. 매치정보 Card
 *  - 매치의 기본정보를 보여주는 UI
 *  - 제목 title
 *  - 설명 description
 *  - 장소 placeName
 *  - 주소 address
 *  - 시작시간 stDate
 *  - lan, lat (지도)
 *  - 매치에 등록된 클럽 리스트
 * 2. 매치 클럽 정보 Card
 *  - 본인이 가입한 클럽 정보만 보여준다.
 *  - 클럽은 ERD를 보면 다중 가입이 가능하기때문에 여러 클럽이 보여질수 있음.
 *  - 클럽별 Tab전환. 클럽이 하나면 탭X
 *  - 클럽내부에서도 클럽정보, 출석정보, 포지션정보, 기록, 평점관리 등을 탭으로 화면 분리
 *  - 클럽정보 (엠블럼, 이름, 회원수, 평균나이, 자체전여부 등등)
 *  - 참석 및 출석 관리
 *     - 참석의 정의: 참석은 매치정보가 올라왔을때 참석이 가능한지 미리 체크하는 용도의 정보
 *     - 출석의 정의: 실제 경기에 나왔는지 출결의 정보
 *     - 참석한 회원이 출석 할 수 있도록 화면구성해야함.
 *  - 포지션정보
 *     - 매니저 이상급의 권한을 가진 회원이 매치를 수정할 수 있도록 화면 구성.
 *  - 기록
 *     - 매치의 기록을 보여준다.
 *     - 누가 골 어시 했는지 한눈에 볼수 있는 화면과 기록할 수 있는 화면을 넣어줌
 *  - 평점관리
 *     - 회원들이 해당 매치에서 다른 회원들의 평점을 입력 할 수 있고 보여줄 수 있는 화면
 * @param _props
 * @returns
 */

const MatchesIdPage = (_props: IMatchesIdPageProps) => {
  const data = useOutletContext<Awaited<ReturnType<typeof layoutLoader>>>();

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
                <CardTitle className="text-base sm:text-lg">{match.title}</CardTitle>
                <CardDescription className="">{match.description}</CardDescription>
              </div>
              {/* 왼쪽: 클럽 정보 */}
            </CardHeader>
            <CardContent>
              <div className="flex justify-between max-sm:flex-col gap-2">
                <div>
                  <p className="flex items-center gap-2 ">
                    <HiLocationMarker className="text-base text-primary" />
                    <span className="text-foreground text-sm">{match.placeName}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <HiHome className="text-base text-primary" />
                    <span className="text-foreground text-sm">{match.address}</span>
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
                          src={matchClub.club?.emblem?.url ?? "/images/club-default-emblem.webp"}
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
            <Select value={selectedMatchClubId} onValueChange={handleSelectedMatchClubIdChange}>
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

export default MatchesIdPage;
