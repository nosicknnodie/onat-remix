/** biome-ignore-all lint/suspicious/noArrayIndexKey: off */
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { useAtomCallback } from "jotai/utils";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { HistoryPlaceDownList, MatchForm, SearchPlace } from "~/features/matches/client";
import { parseUpdate } from "~/features/matches/isomorphic";
import { detailService } from "~/features/matches/server";
import { type IKakaoLocalType, INITIAL_CENTER } from "~/libs";
import { getUser, parseRequestData } from "~/libs/index.server";
import { jsonFail } from "~/utils/action.server";
import { placeHistoryAtom } from "../_libs/state";

export const handle = { breadcrumb: "매치 수정" };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    // 로그인 안된 사용자는 로그인 페이지로 리디렉트
    throw redirect("/auth/login");
  }
  const matchId = params.matchId;

  const data = await detailService.getMatchDetail(matchId!);
  if (!data) throw redirect("/404");
  return data;
};

// action
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const matchId = params.matchId;
  if (!user) {
    // 로그인 안된 사용자는 로그인 페이지로 리디렉트
    throw redirect("/auth/login");
  }
  const raw = await parseRequestData(request);
  const parsed = parseUpdate(raw);
  if (!parsed.ok) return jsonFail("잘못된 요청입니다.", { formErrors: ["INVALID_INPUT"] });

  const { title, description, date, hour, minute, placeName, address, lat, lng } = parsed.data;
  const stDate = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
  const res = await detailService.updateMatch(matchId!, {
    title,
    description,
    stDate,
    placeName: placeName?.toString() ?? "",
    address: address?.toString() ?? "",
    lat: lat ? Number.parseFloat(lat) : null,
    lng: lng ? Number.parseFloat(lng) : null,
    createUserId: user.id,
  });
  if (!res.ok) return jsonFail("요청을 처리할 수 없습니다.");
  return redirect(`/matches/${matchId}`);
};

interface IMatchEditPageProps {}

const MatchEditPage = (_props: IMatchEditPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const match = loaderData.match;
  const [place, setPlace] = useState<IKakaoLocalType | null>({
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
  return (
    <div className="flex flex-col justify-start w-full space-y-2">
      <MatchForm
        defaultTitle={match.title}
        defaultDescription={match.description}
        defaultDate={dayjs(match.stDate).format("YYYY-MM-DD")}
        defaultHour={dayjs(match.stDate).hour().toString()}
        defaultMinute={dayjs(match.stDate).minute().toString()}
        placeName={place?.place_name ?? ""}
        address={place?.address_name ?? ""}
        lat={place?.y ?? ""}
        lng={place?.x ?? ""}
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
