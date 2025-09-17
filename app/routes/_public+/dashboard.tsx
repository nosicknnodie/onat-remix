import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useSession } from "~/contexts";
import { MatchInsightList, MomHighlightList, PostHighlightList } from "~/features/dashboard";
import type { DashboardData } from "~/features/dashboard/index.server";
import { service as dashboardService } from "~/features/dashboard/index.server";
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

  const data = await dashboardService.getDashboardData(user.id);
  return data satisfies DashboardData;
}

const DashBoardPage = (_props: IDashBoardPageProps) => {
  const dashboardData = useLoaderData<typeof loader>();
  const user = useSession();
  if (!user) return null;
  return (
    <div className="space-y-4">
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
      <div className="grid gap-4 lg:grid-cols-2">
        <MatchInsightList
          title="오늘의 경기"
          description="오늘 예정된 매치를 확인하세요"
          emptyMessage="오늘 진행되는 경기가 없습니다."
          items={dashboardData.todayMatches}
        />
        <MatchInsightList
          title="다가오는 참석 요청"
          description="출석 여부를 빠르게 남겨주세요"
          emptyMessage="앞으로 2주 내 참석 요청이 없습니다."
          items={dashboardData.upcomingAttendances}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PostHighlightList
          title="하이라이트 게시글"
          description="내가 쓴 글과 중요 게시글"
          emptyMessage="표시할 게시글이 없습니다."
          items={dashboardData.highlightPosts}
        />
        <MomHighlightList
          title="이번 주 MOM"
          description="클럽별 활약상을 확인하세요"
          emptyMessage="이번 주 MOM 정보가 없습니다."
          items={dashboardData.weeklyMoms}
        />
      </div>
    </div>
  );
};

export default DashBoardPage;
