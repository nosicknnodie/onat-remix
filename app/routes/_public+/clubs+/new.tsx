import type { File } from "@prisma/client";
import { CameraIcon } from "@radix-ui/react-icons";
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
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

export const handle = {
  breadcrumb: "클럽 생성",
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const user = await getUser(request); // 로그인한 사용자 확인 (없으면 리다이렉트 등 처리 가능)
  if (!user) {
    return redirect("/auth/login");
  }

  const userName = user?.name;
  if (!userName) {
    return redirect("/settings/edit");
  }

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
    const club = await prisma.$transaction(async (tx) => {
      const txClub = await tx.club.create({
        data: {
          name,
          description,
          isPublic,
          imageId: imageId || undefined,
          emblemId: emblemId || undefined,
          si: si || null,
          gun: gun || null,
          ownerUserId: user.id,
          createUserId: user.id,
          boards: {
            createMany: {
              data: [
                {
                  name: "공지사항",
                  slug: "notice",
                  order: 0,
                  type: "NOTICE",
                },
                {
                  name: "자유게시판",
                  slug: "free",
                  order: 10,
                  type: "TEXT",
                },
                {
                  name: "갤러리",
                  slug: "gallery",
                  order: 20,
                  type: "GALLERY",
                },
                {
                  name: "자료실",
                  slug: "archive",
                  order: 30,
                  type: "ARCHIVE",
                },
              ],
            },
          },
        },
      });
      await tx.player.create({
        data: {
          userId: user.id,
          clubId: txClub.id,
          nick: userName,
          role: "MASTER",
        },
      });
      return txClub;
    });

    return redirect(`/clubs/${club.id}`);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "클럽 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

interface IClubNewPageProps {}

const ClubNewPage = (_props: IClubNewPageProps) => {
  const actionData = useActionData<typeof action>();
  const [sis, setSis] = useState("");
  const [image, setImage] = useState<null | File>(null);
  const [emblem, setEmblem] = useState<null | File>(null);
  const isPending = false;
  return (
    <>
      <div className="flex flex-col gap-4">
        <div>
          <Card>
            <CardHeader>
              <p className="text-2xl font-semibold text-center">🪽 클럽 생성</p>
              <CardDescription className="w-full text-center">
                클럽 프로필을 입력해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form method="post" className="space-y-6">
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
                    <Input name="name" disabled={isPending} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">클럽 소개</Label>
                    <Textarea
                      name="description"
                      rows={4}
                      disabled={isPending}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="클럽에 대한 간단한 설명을 입력해주세요 (선택)"
                    />
                  </div>
                  <div className="flex justify-start gap-x-4">
                    <div className="space-y-2">
                      <Label htmlFor="si">도시</Label>
                      <Select
                        name="si"
                        disabled={isPending}
                        onValueChange={(e) => setSis(e)}
                        defaultValue={undefined}
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
                      <Select name="gun" disabled={isPending} defaultValue={undefined}>
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
                    <Select name="isPublic" disabled={isPending} defaultValue="true">
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
        </div>
      </div>
    </>
  );
};

export default ClubNewPage;
