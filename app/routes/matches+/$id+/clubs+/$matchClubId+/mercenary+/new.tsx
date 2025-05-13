import { PositionType } from "@prisma/client";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import _ from "lodash";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { prisma } from "~/libs/db/db.server";
import Position from "~/template/Position";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) return null;

  const formData = await request.formData();
  const actionType = formData.get("actionType")?.toString();
  const email = formData.get("email")?.toString();
  const name = formData.get("name")?.toString();
  const userId = formData.get("userId")?.toString();
  const position1 = formData.get("position1")?.toString() as PositionType | undefined;
  const position2 = formData.get("position2")?.toString() as PositionType | undefined;
  const position3 = formData.get("position3")?.toString() as PositionType | undefined;

  if (actionType === "email") {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        position1: true,
        position2: true,
        position3: true,
      },
    });
    if (!user) return null;

    return { user };
  }
  const matchClub = await prisma.matchClub.findUnique({ where: { id: matchClubId } });
  if (!matchClub) return null;

  if (name) {
    await prisma.mercenary.create({
      data: {
        clubId: matchClub.clubId,
        name,
        position1: position1 || null,
        position2: position2 || null,
        position3: position3 || null,
        userId: userId || null,
      },
    });
  }

  return redirect("/matches/" + matchClub.matchId + "/clubs/" + matchClubId + "/mercenary");
};

interface IMercenaryNewPageProps {}

const MercenaryNewPage = (_props: IMercenaryNewPageProps) => {
  const fetcher = useFetcher<typeof action>();
  const [positions, setPositions] = useState<string[]>();
  const [name, setName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.user) {
      setPositions(
        _.compact([
          fetcher.data.user.position1,
          fetcher.data.user.position2,
          fetcher.data.user.position3,
        ]),
      );
      setName(fetcher.data?.user?.name || "");
      setUserId(fetcher.data?.user?.id || null);
    }
  }, [fetcher.data, fetcher.state]);
  return (
    <>
      <fetcher.Form method="post">
        <div className="space-y-2">
          <Input type="hidden" name="actionType" value="email"></Input>
          <Label htmlFor="email">이메일로 검색 (optional)</Label>
          <div className="flex justify-between gap-x-2">
            <Input type="email" name="email" placeholder="youremail@example.com" />
            <Button type="submit" className="">
              검색
            </Button>
          </div>
        </div>
      </fetcher.Form>
      <Card>
        <CardHeader>
          <CardTitle>용병 추가</CardTitle>
          <CardDescription>회원이메일로 검색 혹은 임의의 용병추가</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <fetcher.Form method="post">
            <Input type="hidden" name="userId" value={userId || undefined}></Input>
            <Input type="hidden" name="actionType" value="name"></Input>
            <div className="space-y-2">
              <Label htmlFor="name" className="after:content-['*'] after:text-red-500 after:ml-1">
                용병 이름
              </Label>
              <Input
                type="text"
                name="name"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Input type="hidden" name="position1" value={positions?.at(0)} />
              <Input type="hidden" name="position2" value={positions?.at(1)} />
              <Input type="hidden" name="position3" value={positions?.at(2)} />
              <Position value={positions} onValueChange={(v) => setPositions(v ?? [])} />
            </div>
            <Button type="submit" className="w-full">
              저장
            </Button>
          </fetcher.Form>
        </CardContent>
      </Card>
    </>
  );
};

export default MercenaryNewPage;
