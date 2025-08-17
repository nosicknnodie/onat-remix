import type { PlayerNativeType } from "@prisma/client";
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useNavigation } from "@remix-run/react";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useSession } from "~/contexts/AuthUserContext";
import { invalidateUserSessionCache } from "~/libs/db/adatper";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { NATIVE } from "~/libs/native";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await request.formData();

  const playerNative = (formData.get("playerNative")?.toString() as PlayerNativeType) ?? null;
  const clothesSize = formData.get("clothesSize")?.toString() ?? null;
  const shoesSize = formData.get("shoesSize")?.toString() ?? null;
  const heightRaw = formData.get("height")?.toString() ?? null;

  const height = heightRaw ? Number(heightRaw) : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      playerNative,
      clothesSize,
      shoesSize,
      height,
    },
  });

  await invalidateUserSessionCache(user.id);

  return redirect("/settings/body");
};

export default function BodyPage() {
  const user = useSession();
  const navigation = useNavigation();
  if (!user) return null;
  const isSubmitting = navigation.state === "submitting";
  return (
    <Card className="max-w-xl mx-auto mt-8 w-full">
      <CardHeader>
        <CardTitle>신체 정보 수정</CardTitle>
      </CardHeader>
      <CardContent>
        <form method="POST" className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="playerNative">선출 여부</Label>
            <Select name="playerNative" defaultValue={user.playerNative ?? undefined}>
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(NATIVE).map((key) => (
                  <SelectItem key={key} value={key}>
                    {NATIVE[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="height">키 (cm)</Label>
            <Input name="height" type="number" defaultValue={user.height ?? undefined} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="clothesSize">상의 사이즈</Label>
            <Select name="clothesSize" defaultValue={user.clothesSize ?? undefined}>
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="shoesSize">신발 사이즈</Label>
            <Input name="shoesSize" type="text" defaultValue={user.shoesSize ?? undefined} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            저장
            {isSubmitting && <Loading />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
