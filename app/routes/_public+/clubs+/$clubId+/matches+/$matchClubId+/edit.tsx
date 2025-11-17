import { useParams } from "@remix-run/react";
import { useAtomCallback } from "jotai/utils";
import { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { placeHistoryAtom } from "~/atoms";
import { Button } from "~/components/ui/button";
import { HistoryPlaceDownList, MatchForm, SearchPlace } from "~/features/matches/client";
import {
  type MatchFormFields,
  useMatchClubQuery,
  useSaveMatchMutation,
} from "~/features/matches/isomorphic";
import { type IKakaoLocalType, INITIAL_CENTER } from "~/libs";

export const handle = { breadcrumb: "매치 수정" };

interface IMatchEditPageProps {}

const MatchEditPage = (_props: IMatchEditPageProps) => {
  const params = useParams();
  const matchClubId = params.matchClubId;
  const clubId = params.clubId;
  const { data: matchClubData, isLoading } = useMatchClubQuery(matchClubId, {
    clubId,
    enabled: Boolean(matchClubId),
  });
  const match = useMemo(() => matchClubData?.matchSummary?.match ?? null, [matchClubData]);
  const [place, setPlace] = useState<IKakaoLocalType | null>(null);
  const { mutateAsync: saveMatch } = useSaveMatchMutation({ matchClubId });
  useEffect(() => {
    if (!match) return;
    setPlace({
      address_name: match.address || "",
      place_name: match.placeName || "",
      y: String(match.lat || INITIAL_CENTER[0]),
      x: String(match.lng || INITIAL_CENTER[1]),
      place_url: "",
      road_address_name: "",
      category_group_code: "",
      category_group_name: "",
      category_name: "",
      distance: "",
      phone: "",
      id: "",
    });
  }, [match]);

  const handleSubmit = useAtomCallback(async (_get, set, values: MatchFormFields) => {
    set(placeHistoryAtom, (p) => {
      const preValue = p.find((d) => d.id === place?.id);
      if (preValue) {
        preValue.count = preValue.count ? preValue.count + 1 : 1;
      } else {
        if (place) return [...p, { ...place, count: 1 }];
      }
      return p;
    });
    await saveMatch({ payload: values, matchId: match?.id ?? "" });
  });

  if (isLoading || !match) {
    return (
      <div className="py-10 flex justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleSearchPlaceSubmit = (value: IKakaoLocalType) => {
    setPlace(value);
  };
  const defaultMatch = {
    title: match.title,
    description: match.description ?? "",
    stDate: match.stDate,
    placeName: place?.place_name ?? match.placeName ?? "",
    address: place?.address_name ?? match.address ?? "",
    lat: place?.y ?? match.lat ?? "",
    lng: place?.x ?? match.lng ?? "",
  };

  return (
    <div className="flex flex-col justify-start w-full space-y-2">
      <MatchForm
        defaultMatch={defaultMatch}
        onSubmit={handleSubmit}
        renderPlaceControls={() => (
          <>
            <SearchPlace onSubmit={handleSearchPlaceSubmit}>
              <Button type="button" size="icon">
                <FaSearch />
              </Button>
            </SearchPlace>
            <HistoryPlaceDownList onSetPlace={handleSearchPlaceSubmit} />
          </>
        )}
      />
    </div>
  );
};

export default MatchEditPage;
