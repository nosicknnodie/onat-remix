import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useSession } from "~/contexts";
import { getUser } from "~/libs/index.server";

export const handle = {
  breadcrumb: "Dashboard",
};

interface IDashBoardPageProps {}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    // 로그인 안된 사용자는 로그인 페이지로 리디렉트
    throw redirect("/auth/login");
  }
  return null;
}

const DashBoardPage = (_props: IDashBoardPageProps) => {
  const user = useSession();
  if (!user) return null;
  return (
    <>
      <Card className="mx-auto w-full">
        <CardHeader className="flex flex-row items-center gap-4">
          <img
            src={user.userImage?.url ?? "/images/user_empty.png"}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <CardTitle>{user.name ?? "이름 없음"}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="flex gap-1">
            <span className="font-medium">포지션:</span>
            <span>{user.position1 ?? ""}</span>
            <span>{user.position2 ?? ""}</span>
            <span>{user.position3 ?? ""}</span>
          </div>
          <div>
            <span className="font-medium">지역:</span> {user.si ?? ""} {user.gun ?? ""}
          </div>
          <div>
            <span className="font-medium">성별:</span>{" "}
            {
              {
                MALE: "남자",
                FEMALE: "여자",
                NO: "선택 안함",
              }[user.gender ?? "NO"]
            }
          </div>
          <div>
            <span className="font-medium">키:</span> {user.height ? `${user.height} cm` : "미입력"}
          </div>
          <div>
            <span className="font-medium">생년월일:</span>{" "}
            {user.birth ? new Date(user.birth).toLocaleDateString("ko-KR") : "미입력"}
          </div>
        </CardContent>
      </Card>
      {/* 
          1. 다가오는 매치 정보
            - 다음 경기 일정, 시간, 장소
            - 출석 여부 및 포지션 배치 상태
            - 출석 요청 버튼 (미출석 시)

          2. 내 출석 / 포지션 현황
            - 출석 여부 표시
            - 주포지션 / 보조포지션 / 미배치 안내

          3. 소속 팀 / 클럽 정보
            - 팀명, 클럽명, 내 역할 (주장 등)
            - 최근 경기 요약

          4. 최근 경기 활동 이력
            - 출전 경기 리스트 (최근 3회)
            - 득점, MOM 여부 등 요약

          5. 클럽 공지사항
            - 최근 공지 1~2개 요약
            - '더보기' 링크

          ⚠️ 위 내용은 우선순위 순으로 차례차례 구현 예정
        */}
    </>
  );
};

export default DashBoardPage;
