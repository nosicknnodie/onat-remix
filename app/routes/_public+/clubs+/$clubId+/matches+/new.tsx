/** biome-ignore-all lint/suspicious/noArrayIndexKey: off */
import { useNavigate, useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useAtomCallback } from "jotai/utils";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { placeHistoryAtom } from "~/atoms/placeHistory";
import { Button } from "~/components/ui/button";
import { HistoryPlaceDownList, MatchForm, SearchPlace } from "~/features/matches/client";
import { type MatchFormFields, useSaveMatchMutation } from "~/features/matches/isomorphic";
import type { IKakaoLocalType } from "~/libs/isomorphic";

export const handle = { breadcrumb: "매치 생성" };

interface IMatchesNewProps {}

const MatchesNew = (_props: IMatchesNewProps) => {
  const params = useParams();
  const clubId = params.clubId;
  const [place, setPlace] = useState<IKakaoLocalType | null>(null);
  const navigate = useNavigate();
  const { mutateAsync: saveMatch } = useSaveMatchMutation();
  const handleSearchPlaceSubmit = (value: IKakaoLocalType) => {
    setPlace(value);
  };

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
    const res = await saveMatch({ payload: values, method: "POST" });
    if (res.matchClubId) navigate(`/clubs/${clubId}/matches/${res.matchClubId}`);
  });

  const defaultDate = dayjs().day(6).hour(8).minute(0).second(0).isBefore(dayjs())
    ? dayjs()
        .day(6 + 7)
        .format("YYYY-MM-DD")
    : dayjs().day(6).format("YYYY-MM-DD");
  const defaultMatch = {
    stDate: `${defaultDate}T08:00:00`,
    placeName: place?.place_name ?? "",
    address: place?.address_name ?? "",
    lat: place?.y ?? "",
    lng: place?.x ?? "",
  };

  return (
    <div className="flex flex-col justify-start w-full space-y-2">
      <MatchForm
        defaultClubId={clubId}
        defaultMatch={defaultMatch}
        showIsSelf
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

export default MatchesNew;
