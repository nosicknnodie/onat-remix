import type { File } from "@prisma/client";
import { CameraIcon } from "@radix-ui/react-icons";
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useOutletContext } from "@remix-run/react";
import { useState } from "react";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "~/components/ui/card";
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
import { prisma } from "~/libs/db/db.server"; // prisma 경로에 맞게 수정하세요
import { getUser } from "~/libs/db/lucia.server"; // 사용자 인증 함수 예시
import { SIGUNGU } from "~/libs/sigungu";
import ImageCropperDialog from "~/template/cropper/ImageCropperDialog";
import type { IClubLayoutLoaderData } from "./_layout";
export const handle = { breadcrumb: "수정" };
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const user = await getUser(request); // 로그인한 사용자 확인 (없으면 리다이렉트 등 처리 가능)

  if (!user) {
    return redirect("/auth/login");
  }

  const id = formData.get("id")?.toString();
  const imageId = formData.get("imageId")?.toString() || null;
  const emblemId = formData.get("emblemId")?.toString() || null;
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const isPublic = formData.get("isPublic") === "true";
  const si = formData.get("si")?.toString();
  const gun = formData.get("gun")?.toString();

  if (!name) {
    return Response.json({ error: "클럽 이름은 필수입니다." }, { status: 400 });
  }

  try {
    const club = await prisma.club.update({
      where: { id },
      data: {
        name,
        description,
        isPublic,
        imageId: imageId || undefined,
        emblemId: emblemId || undefined,
        si: si !== "null" ? si || null : null,
        gun: gun !== "null" ? gun || null : null,
      },
    });

    return redirect(`/clubs/${club.id}`);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "클럽 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    // 로그인 안된 사용자는 로그인 페이지로 리디렉트
    throw redirect("/auth/login");
  }

  const id = params.id;
  const club = await prisma.club.findUnique({
    where: { id },
    include: { image: true, emblem: true },
  });
  if (!club) {
    // 클럽가 없는 경우는 404 페이지로 리디렉트
    throw redirect("/404");
  }
  if (user.id !== club.ownerUserId) {
    // 클럽 작성자와 로그인한 사용자가 다른 경우는 404 페이지로 리디렉트

    return redirect(`/clubs/${id}`);
  }
  return null;
};

interface IClubEditPageProps {}

const ClubEditPage = (_props: IClubEditPageProps) => {
  const loaderData = useOutletContext<IClubLayoutLoaderData>();
  const actionData = useActionData<typeof action>();
  const club = loaderData.club;

  const [sis, setSis] = useState(club.si ?? "null");
  const [gun, setGun] = useState(club.gun ?? "null");
  const [image, setImage] = useState<null | File | undefined>(club.image);
  const [emblem, setEmblem] = useState<null | File | undefined>(club.emblem);
  const isPending = false;

  const handleSetSi = (value: string) => {
    setSis((v: string) => {
      if (v !== value) {
        setGun("null");
      }
      return value;
    });
  };
  if (!club) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <p className="text-2xl font-semibold text-center">🛠 클럽 수정</p>
          <CardDescription className="w-full text-center">
            클럽 정보를 수정해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="post" className="space-y-6">
            <input type="hidden" name="id" value={club.id} />
            <input type="hidden" name="imageId" value={image?.id || ""} />
            <input type="hidden" name="emblemId" value={emblem?.id || ""} />
            <div className="relative w-full h-[240px]">
              <img
                alt="clubImage"
                src={image?.url || "/images/club-default-image.webp"}
                className="w-full h-full rounded-md"
              />
              <ImageCropperDialog
                title="클럽 이미지 업로드"
                descirption="클럽 이미지를 업로드해주세요."
                aspectRatio={16 / 9}
                purpose="CLUB_IMAGE"
                onChangeValue={(image) => {
                  setImage(image);
                }}
              >
                <div
                  className="cursor-pointer absolute bottom-2 right-2 bg-background p-2 rounded-lg shadow-md"
                  // onClick={() => setOpen(true)}
                >
                  <CameraIcon />
                </div>
              </ImageCropperDialog>
            </div>
            <div className="space-x-4 w-full flex justify-center min-h-[120px]">
              <div className="w-[120px] h-[120px] relative">
                <img
                  alt="emblem"
                  src={emblem?.url || "/images/onat-emblem.png"}
                  width={120}
                  height={120}
                  className="border-none outline-none rounded-lg"
                ></img>
                <ImageCropperDialog
                  title="클럽 엠블럼 업로드"
                  descirption="클럽 엠블럼을 업로드해주세요."
                  aspectRatio={1}
                  purpose="CLUB_EMBLEM"
                  onChangeValue={(image) => {
                    setEmblem(image);
                  }}
                >
                  <div className="p-1 cursor-pointer absolute bottom-1 right-1 shadow-md">
                    <CameraIcon className="" />
                  </div>
                </ImageCropperDialog>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">클럽 이름</Label>
                <Input name="name" disabled={isPending} defaultValue={club.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">클럽 소개</Label>
                <Textarea
                  name="description"
                  rows={4}
                  disabled={isPending}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="클럽에 대한 간단한 설명을 입력해주세요 (선택)"
                  defaultValue={club.description ?? ""}
                />
              </div>
              <div className="flex justify-start gap-x-4">
                <div className="space-y-2">
                  <Label htmlFor="si">도시</Label>
                  <Select
                    name="si"
                    disabled={isPending}
                    onValueChange={handleSetSi}
                    defaultValue={club.si ?? "null"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="도시 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">선택안함</SelectItem>
                      {Object.keys(SIGUNGU).map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gun">지역</Label>
                  <Select
                    name="gun"
                    disabled={isPending}
                    defaultValue={club.gun ?? "null"}
                    value={gun}
                    onValueChange={(v) => setGun(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="지역 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">선택안함</SelectItem>
                      {sis &&
                        SIGUNGU[sis]?.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isPublic">공개 여부</Label>
                <Select name="isPublic" disabled={isPending} defaultValue={String(club.isPublic)}>
                  <SelectTrigger>
                    <SelectValue placeholder="공개 여부" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">공개</SelectItem>
                    <SelectItem value="false">비공개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <FormError>{actionData?.error}</FormError>
            <FormSuccess>{actionData?.success}</FormSuccess>
            <Button type="submit" disabled={isPending}>
              저장
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default ClubEditPage;
