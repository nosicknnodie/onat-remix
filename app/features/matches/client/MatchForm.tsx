import { zodResolver } from "@hookform/resolvers/zod";
import type { SerializedEditorState } from "lexical";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { PostEditor } from "~/components/lexical/PostEditor";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { EMPTY_MATCH_DESCRIPTION, parseMatchDescription } from "../isomorphic";
import { createSchema } from "../isomorphic/match.schema";
import type { MatchFormDefault, MatchFormFields } from "../isomorphic/match.types";

export type MatchFormProps = {
  defaultClubId?: string;
  defaultMatch?: MatchFormDefault;
  showIsSelf?: boolean;
  onSubmit?: (match: MatchFormFields) => void;
  renderPlaceControls?: () => React.ReactNode;
};

export function MatchForm(props: MatchFormProps) {
  const { defaultClubId, defaultMatch, showIsSelf, onSubmit, renderPlaceControls } = props;

  const matchTitle = defaultMatch?.title ?? "";
  const matchDescription = defaultMatch?.description ?? "";
  const initialEditorState = useMemo<SerializedEditorState>(
    () => parseMatchDescription(matchDescription),
    [matchDescription],
  );
  const stDate = defaultMatch?.stDate ? new Date(defaultMatch.stDate) : new Date();
  const defaultDate = `${stDate.getFullYear()}-${String(stDate.getMonth() + 1).padStart(2, "0")}-${String(stDate.getDate()).padStart(2, "0")}`;
  const defaultHour = String(stDate.getHours());
  const defaultMinute = String(stDate.getMinutes() >= 30 ? 30 : 0);
  const placeName = defaultMatch?.placeName ?? "";
  const address = defaultMatch?.address ?? "";
  const lat = defaultMatch?.lat ?? "";
  const lng = defaultMatch?.lng ?? "";
  const latValue = lat !== null && lat !== undefined ? String(lat) : "";
  const lngValue = lng !== null && lng !== undefined ? String(lng) : "";

  const form = useForm<MatchFormFields>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      clubId: defaultClubId ?? "",
      title: matchTitle,
      description: matchDescription,
      date: defaultDate,
      hour: defaultHour,
      minute: defaultMinute,
      placeName,
      address,
      lat: latValue,
      lng: lngValue,
      isSelf: undefined,
    },
  });
  const { register, setValue, watch, handleSubmit } = form;

  useEffect(() => {
    setValue("clubId", defaultClubId ?? "");
  }, [defaultClubId, setValue]);

  useEffect(() => {
    setValue("placeName", placeName);
    setValue("address", address);
    setValue("lat", latValue);
    setValue("lng", lngValue);
  }, [address, latValue, lngValue, placeName, setValue]);

  useEffect(() => {
    setValue("description", matchDescription || JSON.stringify(EMPTY_MATCH_DESCRIPTION));
  }, [matchDescription, setValue]);

  const hourValue = watch("hour");
  const minuteValue = watch("minute");

  const handleOnUploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload/match-image", {
      method: "POST",
      body: formData,
    });
    return await res.json();
  };

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>{matchTitle ? "매치 수정" : "매치 생성"}</CardTitle>
        <CardDescription>매치를 {matchTitle ? "수정" : "생성"}합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit ?? (() => {}))}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="after:content-['*'] after:text-red-500 after:ml-1">
                매치명
              </Label>
              <Input {...register("title", { required: true })} name="title" type="text" required />
            </div>
            <input hidden {...register("clubId")} />
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="after:content-['*'] after:text-red-500 after:ml-1"
              >
                설명
              </Label>
              <Controller
                control={form.control}
                name="description"
                rules={{ required: true }}
                render={({ field }) => (
                  <PostEditor
                    initialEditorState={initialEditorState}
                    onChange={(state) => field.onChange(JSON.stringify(state))}
                    onUploadImage={handleOnUploadImage}
                    placeholder="매치 설명을 입력해주세요."
                    className="border p-2 rounded-md"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="after:content-['*'] after:text-red-500 after:ml-1">
                매치 날짜
              </Label>
              <div className="flex gap-2 max-sm:flex-col">
                <Input
                  {...register("date", { required: true })}
                  type="date"
                  required
                  className="w-36 max-sm:w-full"
                />
                <div className="flex gap-x-2">
                  <Select name="hour" value={hourValue} onValueChange={(v) => setValue("hour", v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_v, i) => i).map((h) => (
                        <SelectItem key={`hour-${h}`} value={String(h)}>
                          {h}시
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    name="minute"
                    value={minuteValue}
                    onValueChange={(v) => setValue("minute", v)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">정각</SelectItem>
                      <SelectItem value="30">30분</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeName">장소</Label>
              <div className="flex gap-x-2">
                <Input {...register("placeName")} type="text" />
                {renderPlaceControls?.()}
                <input type="hidden" {...register("address")} />
                <input type="hidden" {...register("lat")} />
                <input type="hidden" {...register("lng")} />
              </div>
            </div>

            {showIsSelf && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="isSelf">자체전 여부</Label>
                <Switch
                  name="isSelf"
                  onCheckedChange={(v) => setValue("isSelf", v ? "on" : undefined)}
                  defaultChecked={false}
                />
              </div>
            )}

            <Button type="submit" className="w-full font-semibold">
              저장
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
