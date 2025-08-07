import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);

  if (user) {
    return redirect("/dashboard"); // 로그인 됐으면 대시보드로 리디렉트
  }
  return null;
};

export default function Index() {
  return (
    <>
      <main
        className={cn(
          "mx-auto w-full max-w-screen-lg p-1 md:p-2 2xl:p-3 flex justify-center items-center flex-col"
        )}
      >
        <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
          <h1 className="text-3xl font-bold mb-4 text-primary">
            ONSOA에 오신 것을 환영합니다 👋
          </h1>
          <p className="text-muted-foreground max-w-md">
            ONSOA는 클럽과 매치를 관리하고 커뮤니티에서 의견을 나눌 수 있는 축구
            중심의 플랫폼입니다. 로그인하여 활동을 시작해보세요!
          </p>
        </div>
        <div className="mt-10 flex gap-4 justify-center">
          <Button asChild>
            <Link to="/auth/login">로그인</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth/register">회원가입</Link>
          </Button>
        </div>
        {/* <div className="mt-8 grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
  <FeatureItem icon={<SomeIcon />} title="클럽 관리" description="클럽 생성, 멤버 초대, 용병 모집 등 다양한 기능을 제공합니다." />
  <FeatureItem icon={<AnotherIcon />} title="매치 관리" description="매치 일정을 등록하고 포지션을 배정할 수 있습니다." />
  <FeatureItem icon={<ChatIcon />} title="커뮤니티" description="공지사항, 자유게시판, 개발이슈 게시판을 통해 소통하세요." />
</div> */}
      </main>
    </>
  );
}
