import type { File } from "@prisma/client";
import { CameraIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import ImageCropperDialog from "~/components/cropper/ImageCropperDialog";
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
import { SIGUNGU } from "~/libs/sigungu";
import type { ActionData } from "~/types/action";

interface ClubCreateFormProps {
  isPending: boolean;
  actionData?: ActionData;
}

export function ClubCreateForm({ isPending, actionData }: ClubCreateFormProps) {
  const [sis, setSis] = useState("");
  const [image, setImage] = useState<null | File>(null);
  const [emblem, setEmblem] = useState<null | File>(null);

  return (
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
                  <div className="cursor-pointer absolute bottom-2 right-2 bg-background p-2 rounded-lg shadow-md">
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
                  <FormError>{actionData?.fieldErrors?.name}</FormError>
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
              <FormError>{!actionData?.fieldErrors && actionData?.message}</FormError>
              <FormSuccess>{actionData?.ok && actionData?.message}</FormSuccess>
              <Button type="submit" disabled={isPending}>
                저장
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
