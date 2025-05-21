import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { useAtomCallback } from "jotai/utils";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { IKakaoLocalType, INITIAL_CENTER } from "~/libs/map";
import HistoryPlaceDownList from "../_components/HistoryPlaceDownList";
import SearchPlace from "../_components/SearchPlace";
import { placeHistoryAtom } from "../_libs/state";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    // 로그인 안된 사용자는 로그인 페이지로 리디렉트
    throw redirect("/auth/login");
  }
  const matchId = params.id;

  const match = await prisma.match.findUnique({
    where: {
      id: matchId,
    },
    include: {
      matchClubs: {
        include: {
          club: { include: { image: true, emblem: true } },
        },
      },
    },
  });

  if (!match) {
    throw redirect("/404");
  }

  return { match };
};

// schema
const schema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string(),
  hour: z.string(),
  minute: z.string(),
  placeName: z.string().optional(),
  address: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

// action
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const matchId = params.id;
  if (!user) {
    // 로그인 안된 사용자는 로그인 페이지로 리디렉트
    throw redirect("/auth/login");
  }
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);
  const result = schema.safeParse(raw);
  if (!result.success) {
    return new Response("잘못된 요청입니다.", { status: 400 });
  }

  const { title, description, date, hour, minute, placeName, address, lat, lng } = result.data;

  const matchDate = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
  try {
    await prisma.match.update({
      where: {
        id: matchId,
      },
      data: {
        title,
        description,
        stDate: matchDate,
        placeName: placeName?.toString() ?? "",
        address: address?.toString() ?? "",
        lat: lat ? Number.parseFloat(lat) : null,
        lng: lng ? Number.parseFloat(lng) : null,
        createUserId: user.id,
      },
    });

    return redirect("/matches/" + matchId);
  } catch {
    return new Response("잘못된 요청입니다.", { status: 400 });
  }
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
    <>
      <div className="flex flex-col justify-start w-full space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>매치 수정</CardTitle>
            <CardDescription>매치를 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="after:content-['*'] after:text-red-500 after:ml-1"
                  >
                    매치명
                  </Label>
                  <Input id="title" name="title" type="text" defaultValue={match.title} required />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="after:content-['*'] after:text-red-500 after:ml-1"
                  >
                    설명
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    required
                    defaultValue={match.description}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="date"
                    className="after:content-['*'] after:text-red-500 after:ml-1"
                  >
                    매치 날짜
                  </Label>
                  <div className="flex gap-2 max-sm:flex-col">
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      defaultValue={dayjs(match.stDate).format("YYYY-MM-DD")}
                      required
                      className="w-36 max-sm:w-full"
                    />
                    <div className="flex gap-x-2">
                      <Select name="hour" defaultValue={dayjs(match.stDate).hour().toString()}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i}시
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select name="minute" defaultValue={dayjs(match.stDate).minute().toString()}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">정각</SelectItem>
                          <SelectItem value="30">30분</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeName">장소</Label>
                  <div className="flex gap-x-2">
                    <Input
                      id="placeName"
                      name="placeName"
                      type="text"
                      value={place?.place_name ?? ""}
                      onChange={() => {}}
                    />
                    <SearchPlace onSubmit={handleSearchPlaceSubmit}>
                      <Button type="button" size="icon">
                        <FaSearch />
                      </Button>
                    </SearchPlace>
                    <HistoryPlaceDownList onSetPlace={handleSearchPlaceSubmit} />
                    <input type="hidden" name="address" value={place?.address_name ?? ""} />
                    <input type="hidden" name="lat" value={place?.y ?? ""} />
                    <input type="hidden" name="lng" value={place?.x ?? ""} />
                  </div>
                </div>

                <Button type="submit" className="w-full font-semibold">
                  저장
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MatchEditPage;
