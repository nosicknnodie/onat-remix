import { useNavigate, useOutletContext, useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { MatchClubInsightCard, MatchHeaderCard, MatchSummarySection } from "~/features/matches";
import type { IMatchClubIdLayoutOutletContext } from "./_layout";

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
  const summary = data.summary;

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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <MatchSummarySection summaries={data.summaries} />
        </div>
        <div className="space-y-4">
          {summary ? <MatchClubInsightCard summary={summary} /> : null}
        </div>
      </div>
    </div>
  );
};

export default MatchClubIdPage;
