import { HiClock, HiHome, HiLocationMarker } from "react-icons/hi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
interface IMatchesPageProps {}
export const handle = { breadcrumb: "매치" };
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
  const matches = [
    {
      id: 1,
      title: "일요 정기전",
      description: "매주 일요일에 진행되는 정기전입니다.",
      placeName: "계남초등학교",
      address: "서울시 강남구 테헤란로 123",
      stDate: "2025-05-12 10:00",
      isSelf: true,
    },
    {
      id: 2,
      title: "친선 경기",
      description: "타 구단과의 친선 경기입니다.",
      placeName: "송파체육공원",
      address: "서울시 송파구 올림픽로 88",
      stDate: "2025-05-15 18:30",
      isSelf: false,
    },
  ];

  return (
    <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 gap-4 p-2">
      {matches.map((match) => (
        <Card
          key={match.id}
          className="col-span-1 flex flex-col border border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 min-w-0 flex-1">
            <div className="space-y-1 w-full min-w-0">
              <CardTitle className="text-lg font-semibold truncate">{match.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground line-clamp-2 overflow-hidden break-words w-full">
                {match.description}
              </CardDescription>
            </div>
            <span
              className={`text-xs h-fit px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                match.isSelf ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
              }`}
            >
              {match.isSelf ? "자체전" : "매치전"}
            </span>
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
              <span className="text-foreground">{match.stDate}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchesPage;
