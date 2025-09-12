import type { PositionType } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import _ from "lodash";
import { useState } from "react";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import Position from "~/components/Position";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useActionToast } from "~/hooks";
// 서버 전용 AES는 loader/action 내부에서 동적 import로 사용
import { prisma } from "~/libs/db/db.server";
export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const mercenaryId = params.mercenaryId;

  try {
    const mercenary = await prisma.mercenary.findUnique({
      where: {
        id: mercenaryId,
      },
      include: { user: { include: { userImage: true } } },
    });
    const { AES } = await import("~/libs/index.server");
    const decryptMercenary = {
      ...mercenary,
      hp: mercenary?.hp ? AES.decrypt(mercenary.hp) : "",
    };
    return { mercenary: decryptMercenary };
  } catch (e) {
    console.error(e);
  }

  return { mercenary: null };
};

export const action = async ({ request, params }: LoaderFunctionArgs) => {
  const mercenaryId = params.mercenaryId;
  const formData = await request.formData();
  const name = formData.get("name")?.toString();
  const hp = formData.get("hp")?.toString();
  const description = formData.get("description")?.toString();
  const position1 = formData.get("position1")?.toString() as PositionType | undefined;
  const position2 = formData.get("position2")?.toString() as PositionType | undefined;
  const position3 = formData.get("position3")?.toString() as PositionType | undefined;
  try {
    const { AES } = await import("~/libs/index.server");
    const mercenary = await prisma.mercenary.update({
      where: {
        id: mercenaryId,
      },
      data: {
        name,
        hp: hp ? AES.encrypt(hp) : null,
        description,
        position1,
        position2,
        position3,
      },
    });
    return { success: "수정 완료했습니다.", mercenary };
  } catch (e) {
    console.error(e);
    return { error: "수정 중 오류가 발생했습니다." };
  }
};

interface IMercenaryEditPageProps {}

const MercenaryEditPage = (_props: IMercenaryEditPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  useActionToast(actionData);
  const mercenary = loaderData.mercenary;
  const defaultPositions = mercenary?.user
    ? _.compact([
        mercenary?.user?.position1,
        mercenary?.user?.position2,
        mercenary?.user?.position3,
      ])
    : _.compact([mercenary?.position1, mercenary?.position2, mercenary?.position3]);
  const [positions, setPositions] = useState<string[]>(defaultPositions);
  return (
    <>
      <form method="post">
        <Card>
          <CardHeader>
            <CardTitle>용병 수정</CardTitle>
            <CardDescription>용병 수정 (회원 연결된 용병은 수정사항 제한)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* <Input type="hidden" name="userId" value={mercenary?.userId || undefined}></Input>
          <Input type="hidden" name="actionType" value="name"></Input> */}
            <Input type="hidden" name="mercenaryId" value={mercenary?.id || undefined}></Input>
            <div className="space-y-2">
              <Label htmlFor="name" className="after:content-['*'] after:text-red-500 after:ml-1">
                용병 이름
              </Label>
              <Input
                type="text"
                name="name"
                placeholder="이름"
                defaultValue={mercenary?.user?.name || mercenary?.name || ""}
                disabled={!!mercenary?.user}
                // onChange={(e) => context?.setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="after:content-['*'] after:text-red-500 after:ml-1"
              >
                설명
              </Label>
              <Input
                type="text"
                name="description"
                placeholder="OOO의 친구.."
                defaultValue={mercenary?.description || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hp">전화번호</Label>
              <Input
                type="text"
                name="hp"
                placeholder="전화번호"
                defaultValue={mercenary?.hp || ""}
              />
            </div>
            <div>
              <Input type="hidden" name="position1" value={positions?.at(0)} />
              <Input type="hidden" name="position2" value={positions?.at(1)} />
              <Input type="hidden" name="position3" value={positions?.at(2)} />
              <Position
                value={positions}
                onValueChange={(v) => !loaderData.mercenary?.user && setPositions(v ?? [])}
              />
            </div>
            <FormSuccess>{actionData?.success}</FormSuccess>
            <FormError>{actionData?.error}</FormError>
            <Button type="submit" className="w-full">
              저장
            </Button>
          </CardContent>
        </Card>
      </form>
    </>
  );
};

export default MercenaryEditPage;
