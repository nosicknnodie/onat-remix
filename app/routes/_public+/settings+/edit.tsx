import type { File } from "@prisma/client";
import { CameraIcon } from "@radix-ui/react-icons";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { useEffect, useState } from "react";
import FormSuccess from "~/components/FormSuccess";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupButtonItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useSession } from "~/contexts/AuthUserContext";
import { service as settingsService } from "~/features/settings/index.server";
import { SIGUNGU } from "~/libs/sigungu";
import { cn } from "~/libs/utils";
import ImageCropperDialog from "~/template/cropper/ImageCropperDialog";

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const id = String(form.get("id"));
  const name = String(form.get("name") ?? "");
  const gender = form.get("gender") as "MALE" | "FEMALE" | undefined;
  const birthYear = Number(form.get("birthYear"));
  const birthMonth = Number(form.get("birthMonth"));
  const birthDay = Number(form.get("birthDay"));
  const si = String(form.get("si") ?? "");
  const gun = String(form.get("gun") ?? "");
  const userImageId = form.get("userImageId")?.toString() || null;

  await settingsService.updateProfile({
    id,
    name,
    gender,
    birthYear: Number.isNaN(birthYear) ? null : birthYear,
    birthMonth: Number.isNaN(birthMonth) ? null : birthMonth,
    birthDay: Number.isNaN(birthDay) ? null : birthDay,
    si,
    gun,
    userImageId,
  });

  return Response.json({ success: "수정완료 했습니다." });
};

interface IEditPageProps {}

const EditPage = (_props: IEditPageProps) => {
  const actionData = useActionData<typeof action>();
  const user = useSession();
  const [si, setSi] = useState(user?.si);
  const [imageFile, setImageFile] = useState<undefined | File>(user?.userImage);
  useEffect(() => {
    setSi(user?.si);
    setImageFile(user?.userImage);
  }, [user]);
  if (!user) return null;
  return (
    <Card className="max-w-xl mx-auto mt-8 w-full">
      <CardHeader>
        <CardTitle>회원 정보 수정</CardTitle>
      </CardHeader>
      <CardContent>
        <form method="post" className="space-y-4">
          <Input type="hidden" name="id" defaultValue={user.id} readOnly />
          <Input
            type="hidden"
            name="userImageId"
            value={imageFile?.id}
            onChange={() => {}}
            readOnly={true}
          />
          <div className="w-[120px] h-[120px] relative mx-auto">
            <img
              alt="avatar"
              src={imageFile?.url ?? "/images/user_empty.png"}
              width={120}
              height={120}
              className={cn(
                "w-full h-full outline-none rounded-full border overflow-hidden flex justify-center items-center",
              )}
              // onError={() => setImage("/images/user_84308.png")}
            ></img>
            <ImageCropperDialog
              title="회원 이미지 업로드"
              descirption="회원 이미지를 업로드합니다"
              aspectRatio={1}
              onChangeValue={(file) => {
                setImageFile(file);
              }}
            >
              <CameraIcon
                className="cursor-pointer absolute bottom-1 right-0"
                // onClick={() => setOpen(true)}
              />
            </ImageCropperDialog>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <Input type="email" name="email" defaultValue={user.email} disabled readOnly />
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">이름</Label>
            <Input name="name" defaultValue={user.name ?? undefined} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="birth">생년월일</Label>
            <div className="flex gap-2">
              <Select
                name="birthYear"
                defaultValue={user.birth ? new Date(user.birth).getFullYear().toString() : ""}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="년도" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 120 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select
                name="birthMonth"
                defaultValue={user.birth ? (new Date(user.birth).getMonth() + 1).toString() : ""}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="월" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={`${i + 1}`} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                name="birthDay"
                defaultValue={user.birth ? new Date(user.birth).getDate().toString() : ""}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="일" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={`${i + 1}`} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="gender">성별</Label>

            <RadioGroup
              name="gender"
              defaultValue={user.gender ?? undefined}
              className="flex gap-1"
            >
              <RadioGroupButtonItem value="MALE">남자</RadioGroupButtonItem>
              <RadioGroupButtonItem value="FEMALE">여자</RadioGroupButtonItem>
            </RadioGroup>
          </div>

          <div className="space-y-1">
            <Label htmlFor="si">도시 & 지역</Label>
            <div className="flex gap-2">
              <Select name="si" defaultValue={user.si ?? undefined} onValueChange={setSi}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="도시" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(SIGUNGU).map((si) => {
                    return (
                      <SelectItem key={si} value={si}>
                        {si}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select name="gun" defaultValue={user.gun ?? undefined}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="지역" />
                </SelectTrigger>
                <SelectContent>
                  {SIGUNGU[si ?? ""]?.map((gun) => {
                    return (
                      <SelectItem key={gun} value={gun}>
                        {gun}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {/* <Input name="si" id="si" defaultValue={user.si ?? undefined} /> */}
          </div>
          <FormSuccess>{actionData?.success}</FormSuccess>
          <Button type="submit" className="w-full">
            수정하기
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditPage;
