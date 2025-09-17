import { useNavigate, useOutletContext, useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { MatchHeaderCard, MatchSummarySection } from "~/features/matches";
import type { MatchSummary } from "~/features/matches/index.server";

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

interface IMatchesIdPageProps {}

const MatchesIdPage = (_props: IMatchesIdPageProps) => {
  const data = useOutletContext<MatchSummary>();

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
    <div className="space-y-4">
      <MatchHeaderCard
        title={match.title}
        description={match.description}
        placeName={match.placeName}
        address={match.address}
        stDate={match.stDate}
        matchClubs={matchClubs}
        selectedMatchClubId={selectedMatchClubId}
        onSelectMatchClubId={handleSelectedMatchClubIdChange}
        makeClubHref={(id) => `/matches/${params.id}/clubs/${id}`}
      />
      <MatchSummarySection summaries={data.summaries} />
    </div>
  );
};

export default MatchesIdPage;
