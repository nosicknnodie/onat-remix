import { PositionType } from "@prisma/client";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import _ from "lodash";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useSession } from "~/contexts/AuthUserContext";
import { invalidateUserSessionCache } from "~/libs/db/adatper";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import Position from "~/template/Position";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;
  const formData = await request.formData();

  const position1 =
    (formData.get("position1")?.toString() as PositionType) ?? null;
  const position2 =
    (formData.get("position2")?.toString() as PositionType) ?? null;
  const position3 =
    (formData.get("position3")?.toString() as PositionType) ?? null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      position1,
      position2,
      position3,
    },
  });

  await invalidateUserSessionCache(userId);

  return redirect("/settings/position");
};

interface IPositionPageProps {}

const PositionPage = (_props: IPositionPageProps) => {
  const user = useSession();
  const defaultPositions = _.compact([
    user?.position1,
    user?.position2,
    user?.position3,
  ]);
  const [positions, setPositions] = useState<string[]>(defaultPositions);
  return (
    <>
      <form method="post">
        <Input type="hidden" name="position1" value={positions?.at(0) ?? ""} />
        <Input type="hidden" name="position2" value={positions?.at(1) ?? ""} />
        <Input type="hidden" name="position3" value={positions?.at(2) ?? ""} />
        <Position
          value={positions}
          onValueChange={(v) => setPositions(v ?? [])}
        />
        <div className="w-full">
          <Button type="submit" className="w-full">
            저장
          </Button>
        </div>
      </form>
    </>
  );
};

export default PositionPage;
