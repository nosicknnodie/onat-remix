import type { File } from "@prisma/client";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { CameraIcon } from "@radix-ui/react-icons";
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useParams } from "@remix-run/react";
import { useRef, useState } from "react";
import ImageCropperDialog from "~/components/cropper/ImageCropperDialog";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Avatar } from "~/components/ui/avatar";
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
import { useClubDetailsQuery } from "~/features/clubs/isomorphic";
import { service } from "~/features/clubs/server";
import { useActionToast, useToast } from "~/hooks";
import { SIGUNGU } from "~/libs";
import { getUser } from "~/libs/index.server"; // 사용자 인증 함수 예시
export const handle = { breadcrumb: "수정" };
export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request); // 로그인한 사용자 확인 (없으면 리다이렉트 등 처리 가능)

  if (!user) {
    return redirect("/auth/login");
  }

  const formData = await request.formData();
  const result = await service.updateClub(formData, user.id);

  if (result.ok && result.club) {
    return redirect(`/clubs/${result.club.id}`);
  } else {
    return Response.json({ error: result.message }, { status: 422 });
  }
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    // 로그인 안된 사용자는 로그인 페이지로 리디렉트
    throw redirect("/auth/login");
  }

  const ownerId = await service.getClubOwner(params.clubId as string);

  if (!ownerId) {
    // 클럽가 없는 경우는 404 페이지로 리디렉트
    throw redirect("/404");
  }
  if (user.id !== ownerId) {
    // 클럽 작성자와 로그인한 사용자가 다른 경우는 404 페이지로 리디렉트

    return redirect(`/clubs/${params.clubId}`);
  }
  return null;
};

interface IClubEditPageProps {}

const ClubEditPage = (_props: IClubEditPageProps) => {
  const { clubId } = useParams();
  const { data: club } = useClubDetailsQuery(clubId ?? "", { enabled: Boolean(clubId) });
  const actionData = useActionData<typeof action>();
  useActionToast(actionData);

  const [sis, setSis] = useState(club?.si ?? "null");
  const [gun, setGun] = useState(club?.gun ?? "null");
  const [image, setImage] = useState<null | File | undefined>(club?.image);
  const [emblem, setEmblem] = useState<null | File | undefined>(club?.emblem);
  const webhookRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const isPending = false;
  if (!club) {
    return null;
  }

  const handleSetSi = (value: string) => {
    setSis((v: string) => {
      if (v !== value) {
        setGun("null");
      }
      return value;
    });
  };
  return (
    <>
      <Card className="border-none shadow-none">
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
                <Avatar className="w-full h-full">
                  <AvatarImage
                    src={emblem?.url || "/images/club-default-emblem.webp"}
                  ></AvatarImage>
                  <AvatarFallback className="bg-primary">
                    <Loading />
                  </AvatarFallback>
                </Avatar>
                <ImageCropperDialog
                  title="클럽 엠블럼 업로드"
                  descirption="클럽 엠블럼을 업로드해주세요."
                  aspectRatio={1}
                  purpose="CLUB_EMBLEM"
                  onChangeValue={(image) => {
                    setEmblem(image);
                  }}
                >
                  <div className="p-1 cursor-pointer absolute bottom-1 right-1 shadow-md bg-white rounded-full">
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
                <Label htmlFor="discordWebhook">Discord Webhook (선택)</Label>
                <Input
                  type="url"
                  name="discordWebhook"
                  ref={webhookRef}
                  disabled={isPending}
                  defaultValue={club.discordWebhook ?? ""}
                  placeholder="https://discord.com/api/webhooks/..."
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    const webhookUrl = webhookRef.current?.value.trim();
                    if (!webhookUrl) {
                      toast({ title: "Webhook URL을 입력해주세요." });
                      return;
                    }
                    try {
                      const res = await fetch(`/api/clubs/${club.id}/webhook/discord/test`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ webhookUrl }),
                      });
                      const result = (await res.json().catch(() => ({}))) as {
                        ok?: boolean;
                        error?: string;
                      };
                      if (res.ok && result.ok) {
                        toast({ title: "테스트 메시지를 전송했어요." });
                      } else {
                        toast({
                          title: "전송 실패",
                          description: result.error || "잠시 후 다시 시도해주세요.",
                        });
                      }
                    } catch (_error) {
                      toast({ title: "전송 실패", description: "네트워크 오류가 발생했습니다." });
                    }
                  }}
                >
                  Webhook 테스트
                </Button>
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
