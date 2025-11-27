import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { FcGoogle } from "react-icons/fc";
import { SiNaver } from "react-icons/si";
import { InAppOauthNotice, useIsInAppBrowser } from "~/features/auth/client";
import { cn } from "~/libs";
import { getUser } from "~/libs/index.server";
import DashBoardPage from "./dashboard";

export const handle = {
  breadcrumb: "홈",
};
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);

  // if (user) {
  //   return redirect("/dashboard"); // 로그인 됐으면 대시보드로 리디렉트
  // }
  return { user };
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const user = loaderData.user;
  const isInApp = useIsInAppBrowser();
  if (user) {
    return <DashBoardPage />;
  }
  return (
    <>
      <main
        className={cn(
          "mx-auto w-full max-w-screen-lg p-1 md:p-2 2xl:p-3 flex justify-center items-center flex-col",
        )}
      >
        <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
          <h1 className="text-3xl font-bold mb-4 text-primary">ONSOA에 오신 것을 환영합니다 👋</h1>
          <p className="text-muted-foreground max-w-md">
            ONSOA는 클럽과 매치를 관리하고 커뮤니티에서 의견을 나눌 수 있는 축구 중심의
            플랫폼입니다. 로그인하여 활동을 시작해보세요!
          </p>
        </div>
        <div className="mt-10 flex flex-col gap-3 justify-center items-center w-full max-w-xs">
          {isInApp ? (
            <InAppOauthNotice />
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <Link
                to="/api/auth/oauth/google"
                prefetch="none"
                className="flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
              >
                <FcGoogle />
                <span>Google로 계속하기</span>
              </Link>
              <Link
                to="/api/auth/oauth/naver"
                prefetch="none"
                className="flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
              >
                <SiNaver className="text-[#03c75a]" />
                <span>네이버로 계속하기</span>
              </Link>
            </div>
          )}
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
