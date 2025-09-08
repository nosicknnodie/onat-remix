import { useNavigate, useOutletContext, useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { MatchHeaderCard } from "~/features/matches";
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
  return (
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
  );
};

export default MatchClubIdPage;
