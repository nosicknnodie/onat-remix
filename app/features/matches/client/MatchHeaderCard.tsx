import type { File, User } from "@prisma/client";
import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { FaArrowAltCircleLeft, FaRegComment } from "react-icons/fa";
import { HiClock, HiLocationMarker, HiOutlineClipboardCopy } from "react-icons/hi";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Link } from "~/components/ui/Link";
import { useToast } from "~/hooks";
import { cn } from "~/libs";

export interface MatchHeaderCardProps {
  title: string;
  placeName?: string | null;
  address?: string | null;
  stDate: string | Date;
  createUser?: (User & { userImage?: File | null }) | null;
  createdAt?: Date | string;
  headerTabs?: ReactNode;
  footerActions?: ReactNode;
  commentCount?: number;
  children?: ReactNode;
}

export const MatchHeaderCard = ({
  title,
  placeName,
  address,
  stDate,
  createUser,
  createdAt,
  headerTabs,
  footerActions,
  commentCount,
  children,
}: MatchHeaderCardProps) => {
  const { toast } = useToast();
  const formattedDate = dayjs(stDate).format("YYYY-MM-DD (ddd) HH:mm");
  const displayCommentCount = commentCount ?? 0;

  const handleCopyAddress = async () => {
    if (!address) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast({
        title: "주소를 복사할 수 없어요.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "주소를 복사했어요.",
        description: address,
      });
    } catch {
      toast({
        title: "주소를 복사할 수 없어요.",
        variant: "destructive",
      });
    }
  };

  const createdAtDate = createdAt ? new Date(createdAt) : null;

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link to="../" className="hidden md:block" aria-label="이전 페이지로">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <FaArrowAltCircleLeft className="size-6" />
              </Button>
            </Link>
            <Avatar className="size-8">
              <AvatarImage src={createUser?.userImage?.url || "/images/user_empty.png"} />
              <AvatarFallback className="bg-primary-foreground">
                <Loading />
              </AvatarFallback>
            </Avatar>
            {createUser?.name ? <span className="text-foreground">{createUser.name}</span> : null}
            {createdAtDate ? <span>•</span> : null}
            {createdAtDate ? (
              <span>
                {formatDistance(createdAtDate, new Date(), { addSuffix: true, locale: ko })}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-semibold sm:text-xl">{title}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {placeName ? (
            <span className="flex items-center gap-2">
              <HiLocationMarker className="text-base text-primary" />
              <span className="text-foreground break-words">{placeName}</span>
            </span>
          ) : null}
          {address ? (
            <button
              type="button"
              onClick={handleCopyAddress}
              className={cn(
                "flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-primary transition-colors",
                "hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              )}
            >
              <HiOutlineClipboardCopy className="text-base" />
              <span className="text-sm font-medium">주소 복사</span>
            </button>
          ) : null}
          <span className="flex items-center gap-2">
            <HiClock className="text-base text-primary" />
            <span className="text-foreground">{formattedDate}</span>
          </span>
        </div>
        {headerTabs ? <div className="-mb-2 pt-1">{headerTabs}</div> : null}
      </CardHeader>
      <CardContent className="space-y-6 p-2 pt-6">{children}</CardContent>
      <CardFooter className="flex items-center gap-4 p-2">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm">
          <FaRegComment className="text-muted-foreground" />
          <span className="font-medium text-foreground">{displayCommentCount}</span>
        </div>
        {footerActions ? <div className="ml-auto">{footerActions}</div> : null}
      </CardFooter>
    </Card>
  );
};
