import dayjs from "dayjs";
import { Fragment } from "react/jsx-runtime";
import { HiClock, HiHome, HiLocationMarker } from "react-icons/hi";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Link } from "~/components/ui/Link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type MatchHeaderClub = {
  id: string;
  club?: {
    name: string;
    emblem?: { url?: string | null } | null;
  } | null;
};

export interface MatchHeaderCardProps {
  title: string;
  description?: string | null;
  placeName?: string | null;
  address?: string | null;
  stDate: string | Date;
  matchClubs: MatchHeaderClub[];
  selectedMatchClubId?: string;
  onSelectMatchClubId?: (id: string) => void;
  makeClubHref?: (id: string) => string;
}

export const MatchHeaderCard = ({
  title,
  description,
  placeName,
  address,
  stDate,
  matchClubs,
  selectedMatchClubId,
  onSelectMatchClubId,
  makeClubHref,
}: MatchHeaderCardProps) => {
  return (
    <Card>
      <div className="flex justify-between">
        <div>
          <CardHeader>
            <div>
              <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between max-sm:flex-col gap-2">
              <div>
                {placeName ? (
                  <p className="flex items-center gap-2">
                    <HiLocationMarker className="text-base text-primary" />
                    <span className="text-foreground text-sm">{placeName}</span>
                  </p>
                ) : null}
                {address ? (
                  <p className="flex items-center gap-2">
                    <HiHome className="text-base text-primary" />
                    <span className="text-foreground text-sm">{address}</span>
                  </p>
                ) : null}
                <p className="flex items-center gap-2">
                  <HiClock className="text-base text-primary" />
                  <span className="text-foreground text-sm">
                    {dayjs(stDate).format("YYYY-MM-DD (ddd) HH:mm")}
                  </span>
                </p>
              </div>
              <div className="flex items-end" />
            </div>
          </CardContent>
        </div>
        <div className="px-6 max-sm:min-w-40 sm:min-w-72 flex flex-col justify-center items-center gap-2">
          <div className="flex items-center space-x-2">
            {matchClubs.map((mc, i) => (
              <Fragment key={mc.id}>
                {i !== 0 ? (
                  <div className="flex whitespace-nowrap items-center text-sm font-semibold">
                    <span className="text-primary">vs</span>
                  </div>
                ) : null}
                <div className="flex whitespace-nowrap items-center text-sm font-semibold gap-1">
                  {makeClubHref ? (
                    <Link to={makeClubHref(mc.id)} className="flex gap-x-2 items-center">
                      <Avatar>
                        <AvatarImage
                          src={mc.club?.emblem?.url ?? "/images/club-default-emblem.webp"}
                        />
                        <AvatarFallback className="bg-primary">
                          <Loading />
                        </AvatarFallback>
                      </Avatar>
                      <span>{mc.club?.name}</span>
                    </Link>
                  ) : (
                    <div className="flex gap-x-2 items-center">
                      <Avatar>
                        <AvatarImage
                          src={mc.club?.emblem?.url ?? "/images/club-default-emblem.webp"}
                        />
                        <AvatarFallback className="bg-primary">
                          <Loading />
                        </AvatarFallback>
                      </Avatar>
                      <span>{mc.club?.name}</span>
                    </div>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
          {onSelectMatchClubId ? (
            <Select value={selectedMatchClubId} onValueChange={onSelectMatchClubId}>
              <SelectTrigger className="min-w-24 max-w-52">
                <SelectValue placeholder="클럽 선택" />
              </SelectTrigger>
              <SelectContent>
                {matchClubs.map((mc) => (
                  <SelectItem key={mc.id} value={mc.id}>
                    {mc.club?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>
    </Card>
  );
};
