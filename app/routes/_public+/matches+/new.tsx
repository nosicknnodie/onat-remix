/** biome-ignore-all lint/suspicious/noArrayIndexKey: off */
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { useAtomCallback } from "jotai/utils";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { HistoryPlaceDownList, MatchForm, SearchPlace } from "~/features/matches/client";
import { parseCreate } from "~/features/matches/isomorphic";
import { createService } from "~/features/matches/server";
import type { IKakaoLocalType } from "~/libs";
import { getUser, parseRequestData } from "~/libs/index.server";
import { jsonFail } from "~/utils/action.server";
import { placeHistoryAtom } from "../../../atoms/placeHistory";

export const handle = { breadcrumb: "매치 생성" };

interface IMatchesNewProps {}

// loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) throw redirect("/auth/login");
  const { clubs } = await createService.getNewMatchData(user.id);
  return { clubs };
};

// action
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) throw redirect("/auth/login");
  const raw = await parseRequestData(request);
  const parsed = parseCreate(raw);
  if (!parsed.ok) return jsonFail("잘못된 요청입니다.", { formErrors: ["INVALID_INPUT"] });

  const { clubId, title, description, date, hour, minute, placeName, address, lat, lng, isSelf } =
    parsed.data;
  const stDate = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
  const res = await createService.createMatch({
    clubId,
    title,
    description,
    stDate,
    placeName: placeName?.toString() ?? "",
    address: address?.toString() ?? "",
    lat: lat ? Number.parseFloat(lat) : null,
    lng: lng ? Number.parseFloat(lng) : null,
    isSelf: isSelf === "on",
    createUserId: user.id,
  });
  if (!res.ok) return jsonFail("요청을 처리할 수 없습니다.");
  return redirect(`/matches/${res.id}`);
};

const MatchesNew = (_props: IMatchesNewProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const [place, setPlace] = useState<IKakaoLocalType | null>(null);
  const handleSearchPlaceSubmit = (value: IKakaoLocalType) => {
    setPlace(value);
  };

  const handleSubmit = useAtomCallback(async (_get, set) => {
    set(placeHistoryAtom, (p) => {
      const preValue = p.find((d) => d.id === place?.id);
      if (preValue) {
        preValue.count = preValue.count ? preValue.count + 1 : 1;
      } else {
        if (place) return [...p, { ...place, count: 1 }];
      }
      return p;
    });
    return true;
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
        defaultClubId={loaderData?.clubs?.[0]?.id}
        defaultMatch={defaultMatch}
        showIsSelf
        onSubmit={() => handleSubmit()}
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
