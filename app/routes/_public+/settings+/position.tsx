import type { PositionType } from "@prisma/client";
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import _ from "lodash";
import { useEffect, useState } from "react";
import Position from "~/components/Position";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useSession } from "~/contexts";
import { settingsService } from "~/features/auth/server";
import { getUser } from "~/libs/index.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;
  const formData = await request.formData();

  const position1 = (formData.get("position1")?.toString() as PositionType) ?? null;
  const position2 = (formData.get("position2")?.toString() as PositionType) ?? null;
  const position3 = (formData.get("position3")?.toString() as PositionType) ?? null;
  await settingsService.updatePosition(userId, { position1, position2, position3 });

  return redirect("/settings/position");
};

interface IPositionPageProps {}

const PositionPage = (_props: IPositionPageProps) => {
  const user = useSession();
  const [positions, setPositions] = useState<string[]>();
  useEffect(() => {
    setPositions(_.compact([user?.position1, user?.position2, user?.position3]));
  }, [user]);
  return (
    <>
      <Card className="mx-auto mt-8 w-full">
        <CardHeader>
          <CardTitle>포지션 변경</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="post">
            <Input type="hidden" name="position1" value={positions?.at(0) ?? ""} />
            <Input type="hidden" name="position2" value={positions?.at(1) ?? ""} />
            <Input type="hidden" name="position3" value={positions?.at(2) ?? ""} />
            <Position value={positions} onValueChange={(v) => setPositions(v ?? [])} />
            <div className="w-full">
              <Button type="submit" className="w-full">
                저장
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default PositionPage;
