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
import { Textarea } from "~/components/ui/textarea";

type ClubLite = { id: string; name: string };

export type MatchFormProps = {
  clubs?: ClubLite[];
  defaultClubId?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultDate: string; // YYYY-MM-DD
  defaultHour: string; // "0".."23"
  defaultMinute: string; // "0" or "30"
  placeName?: string;
  address?: string;
  lat?: string;
  lng?: string;
  showIsSelf?: boolean;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  renderPlaceControls?: () => React.ReactNode;
};

export function MatchForm(props: MatchFormProps) {
  const {
    clubs,
    defaultClubId,
    defaultTitle,
    defaultDescription,
    defaultDate,
    defaultHour,
    defaultMinute,
    placeName,
    address,
    lat,
    lng,
    showIsSelf,
    onSubmit,
    renderPlaceControls,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{defaultTitle ? "매치 수정" : "매치 생성"}</CardTitle>
        <CardDescription>매치를 {defaultTitle ? "수정" : "생성"}합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form method="post" onSubmit={onSubmit}>
          <div className="space-y-4">
            {clubs && (
              <div className="space-y-2">
                <Label
                  htmlFor="clubId"
                  className="after:content-['*'] after:text-red-500 after:ml-1"
                >
                  클럽선택
                </Label>
                <Select name="clubId" defaultValue={defaultClubId ?? clubs[0]?.id ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="클럽 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title" className="after:content-['*'] after:text-red-500 after:ml-1">
                매치명
              </Label>
              <Input name="title" type="text" required defaultValue={defaultTitle ?? ""} />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="after:content-['*'] after:text-red-500 after:ml-1"
              >
                설명
              </Label>
              <Textarea
                name="description"
                rows={3}
                required
                defaultValue={defaultDescription ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="after:content-['*'] after:text-red-500 after:ml-1">
                매치 날짜
              </Label>
              <div className="flex gap-2 max-sm:flex-col">
                <Input
                  name="date"
                  type="date"
                  defaultValue={defaultDate}
                  required
                  className="w-36 max-sm:w-full"
                />
                <div className="flex gap-x-2">
                  <Select name="hour" defaultValue={defaultHour}>
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
                  <Select name="minute" defaultValue={defaultMinute}>
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
                <Input name="placeName" type="text" value={placeName ?? ""} onChange={() => {}} />
                {renderPlaceControls?.()}
                <input type="hidden" name="address" value={address ?? ""} />
                <input type="hidden" name="lat" value={lat ?? ""} />
                <input type="hidden" name="lng" value={lng ?? ""} />
              </div>
            </div>

            {showIsSelf && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="isSelf">자체전 여부</Label>
                <Switch name="isSelf" />
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
