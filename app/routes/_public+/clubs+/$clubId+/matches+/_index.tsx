import { Link, useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useCallback, useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { HiClock, HiHome, HiLocationMarker } from "react-icons/hi";
import { InfiniteSentinel } from "~/components/InfiniteSentinel";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { type ClubMatchFeed, useClubMatchFeedInfiniteQuery } from "~/features/clubs/isomorphic";

interface IMatchesPageProps {}

/**
 * 1. 경기 매치리스트를 보여준다.
 * 2. 매치 카드에는 각 정보들이 들어있다.
 *    - 타이틀 title
 *    - 설명 description
 *    - 경기 장소 placeName (예: 계남초등학교)
 *    - 주소 address
 *    - 시작시간 stDate
 *    - 자체전여부 isSelf
 *
 * @param _props
 * @returns
 */
const MatchesPage = (_props: IMatchesPageProps) => {
  const { clubId } = useParams();
  if (!clubId) {
    throw new Error("clubId is missing from route params");
  }

  const { data, isLoading, error, refetch, fetchNextPage, isFetchingNextPage } =
    useClubMatchFeedInfiniteQuery(clubId);
  const matchClubs = useMemo<ClubMatchFeed["matches"]>(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.matches);
  }, [data]);
  const pageInfo = data?.pages.at(-1)?.pageInfo;
  const hasMore = pageInfo?.hasMore ?? false;
  const handleLoadMore = useCallback(async () => {
    await fetchNextPage();
  }, [fetchNextPage]);

  if (error) {
    return (
      <div className="py-8 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <p>매치 정보를 불러오지 못했습니다.</p>
        <button type="button" className="text-primary" onClick={() => void refetch()}>
          다시 시도하기
        </button>
      </div>
    );
  }

  if (isLoading && matchClubs.length === 0) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 gap-4">
        {matchClubs.map((matchClub) => {
          const match = matchClub.match;
          const relatedClubs = match?.matchClubs?.length ? match.matchClubs : [matchClub];
          return (
            <Link key={matchClub.id} to={`/clubs/${matchClub.clubId}/matches/${matchClub.id}`}>
              <Card className="col-span-1 flex flex-col border border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 min-w-0 flex-1">
                  <div className="space-y-1 w-full min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">{match.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2 overflow-hidden break-words w-full">
                      {match.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {relatedClubs.map((clubItem, i) => (
                      <Fragment key={clubItem.id}>
                        {i !== 0 && (
                          <div className="flex whitespace-nowrap items-center text-sm font-semibold">
                            <span className="text-primary">vs</span>
                          </div>
                        )}
                        <div className="flex whitespace-nowrap items-center text-sm font-semibold gap-1">
                          <Avatar>
                            <AvatarImage
                              src={clubItem.club?.emblem?.url ?? "/images/club-default-emblem.webp"}
                            />
                            <AvatarFallback className="bg-primary">
                              <Loading />
                            </AvatarFallback>
                          </Avatar>
                          <span>{clubItem.club?.name}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <HiLocationMarker className="text-base text-primary" />
                    <span className="text-foreground">{match.placeName}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <HiHome className="text-base text-primary" />
                    <span className="text-foreground">{match.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <HiClock className="text-base text-primary" />
                    <span className="text-foreground">
                      {dayjs(match.stDate).format("YYYY-MM-DD (ddd) HH:mm")}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      <InfiniteSentinel
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        disabled={isFetchingNextPage}
      />
    </div>
  );
};

export default MatchesPage;
