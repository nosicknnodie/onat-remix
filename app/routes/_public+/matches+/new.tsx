import { Club } from "@prisma/client";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { useAtomCallback } from "jotai/utils";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { IKakaoLocalType } from "~/libs/map";
import HistoryPlaceDownList from "./_components/HistoryPlaceDownList";
import SearchPlace from "./_components/SearchPlace";
import { placeHistoryAtom } from "./_libs/state";

export const handle = { breadcrumb: "매치 생성" };

interface IMatchesNewProps {}

// loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    // 로그인 안된 사용자는 로그인 페이지로 리디렉트
    throw redirect("/auth/login");
  }
  const players = await prisma.player.findMany({
    where: {
      userId: user.id,
      role: { in: ["MASTER", "MANAGER"] },
    },
    include: {
      club: true,
    },
  });
  const clubs = players.map((player) => player.club);

  return Response.json({ clubs });
};

// schema
const schema = z.object({
  clubId: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  hour: z.string(),
  minute: z.string(),
  placeName: z.string().optional(),
  address: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  isSelf: z.union([z.literal("on"), z.undefined()]),
});

// action
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
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

  const {
    clubId,
    title,
    description,
    date,
    hour,
    minute,
    placeName,
    address,
    lat,
    lng,
    isSelf,
  } = result.data;
  const isSelfMatch = isSelf === "on";
  const matchDate = new Date(
    `${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
  );
  try {
    const res = await prisma.$transaction(async (tx) => {
      const txMatch = await tx.match.create({
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
      const matchClub = await tx.matchClub.create({
        data: {
          matchId: txMatch.id,
          clubId,
          isSelf: isSelfMatch,
        },
      });

      /**
       * 자체전일경우 팀을 생성해야함
       */
      if (isSelfMatch) {
        const beforeTeam = await tx.matchClub.findFirst({
          where: {
            clubId: clubId,
            isSelf: true,
          },
          orderBy: {
            match: {
              stDate: "desc",
            },
          },
          include: {
            teams: true,
          },
        });
        if (beforeTeam?.teams && beforeTeam?.teams?.length > 2) {
          await Promise.all(
            beforeTeam.teams.map((team) => {
              return tx.team.create({
                data: {
                  name: team.name,
                  color: team.color,
                  matchClubId: matchClub.id,
                },
              });
            })
          );
        } else {
          await Promise.all([
            tx.team.create({
              data: {
                name: "Team A",
                color: "#000000",
                matchClubId: matchClub.id,
              },
            }),
            tx.team.create({
              data: {
                name: "Team B",
                color: "#ffffff",
                matchClubId: matchClub.id,
              },
            }),
          ]);
        }
      }
      const teams = await tx.team.findMany({
        where: {
          matchClubId: matchClub.id,
        },
      });

      // 자체전인데 통신적인문제로 팀이 생성되지 않은경우
      if (isSelfMatch && teams.length < 2) {
        throw new Error("통신오류");
      }
      // 기본 쿼터 생성
      await Promise.all(
        [1, 2, 3, 4].map((num) =>
          tx.quarter.create({
            data: {
              order: num,
              matchClubId: matchClub.id,
              isSelf: isSelfMatch,
              ...(isSelfMatch && {
                team1Id: teams[0].id,
                team2Id: teams[1].id,
              }),
            },
          })
        )
      );
      return txMatch;
    });
    return redirect("/matches/" + res.id);
  } catch (e) {
    console.error("[matches/new:action] error - ", e);
    return new Response("잘못된 요청입니다.", { status: 400 });
  }
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

  return (
    <>
      <div className="flex flex-col justify-start w-full space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>매치 생성</CardTitle>
            <CardDescription>매치를 생성합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" onSubmit={() => handleSubmit()}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="isPublic"
                    className="after:content-['*'] after:text-red-500 after:ml-1"
                  >
                    클럽선택
                  </Label>
                  <Select
                    name="clubId"
                    defaultValue={loaderData?.clubs?.[0]?.id ?? ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="클럽 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {loaderData?.clubs?.map((club: Club) => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="after:content-['*'] after:text-red-500 after:ml-1"
                  >
                    매치명
                  </Label>
                  <Input id="title" name="title" type="text" required />
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
                      defaultValue={
                        dayjs()
                          .day(6)
                          .hour(8)
                          .minute(0)
                          .second(0)
                          .isBefore(dayjs())
                          ? dayjs()
                              .day(6 + 7)
                              .format("YYYY-MM-DD")
                          : dayjs().day(6).format("YYYY-MM-DD")
                      }
                      required
                      className="w-36 max-sm:w-full"
                    />
                    <div className="flex gap-x-2">
                      <Select name="hour" defaultValue="8">
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
                      <Select name="minute" defaultValue="0">
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
                    <HistoryPlaceDownList
                      onSetPlace={handleSearchPlaceSubmit}
                    />
                    <input
                      type="hidden"
                      name="address"
                      value={place?.address_name ?? ""}
                    />
                    <input type="hidden" name="lat" value={place?.y ?? ""} />
                    <input type="hidden" name="lng" value={place?.x ?? ""} />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="isSelf">자체전 여부</Label>
                  <Switch id="isSelf" name="isSelf" />
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

export default MatchesNew;
