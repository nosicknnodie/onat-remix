/** biome-ignore-all lint/suspicious/noArrayIndexKey: off */
import type { Club } from "@prisma/client";
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { useAtomCallback } from "jotai/utils";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { HistoryPlaceDownList, MatchForm, SearchPlace } from "~/features/matches";
import { create as matches } from "~/features/matches/index.server";
import { getUser } from "~/libs/db/lucia.server";
import type { IKakaoLocalType } from "~/libs/map";
import { placeHistoryAtom } from "./_libs/state";

export const handle = { breadcrumb: "매치 생성" };

interface IMatchesNewProps {}

// loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) throw redirect("/auth/login");
  const { clubs } = await matches.service.getNewMatchData(user.id);
  return { clubs };
};

// action
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) throw redirect("/auth/login");
  const parsed = await matches.validators.parseCreateForm(request);
  if (!parsed.ok)
    return Response.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });

  const { clubId, title, description, date, hour, minute, placeName, address, lat, lng, isSelf } =
    parsed.data;
  const stDate = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
  const res = await matches.service.createMatch({
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
  if (!res.ok) return Response.json({ ok: false, message: res.message }, { status: 400 });
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

  return (
    <div className="flex flex-col justify-start w-full space-y-2">
      <MatchForm
        clubs={loaderData.clubs as Club[]}
        defaultClubId={loaderData?.clubs?.[0]?.id}
        defaultDate={defaultDate}
        defaultHour="8"
        defaultMinute="0"
        placeName={place?.place_name ?? ""}
        address={place?.address_name ?? ""}
        lat={place?.y ?? ""}
        lng={place?.x ?? ""}
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
