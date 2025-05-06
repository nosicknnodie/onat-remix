import { LoaderFunctionArgs, redirect } from "@remix-run/node";
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
          "mx-auto w-full max-w-screen-lg p-1 md:p-2 2xl:p-3 flex justify-center items-center "
        )}
      >
        로그인이 필요합니다.
      </main>
    </>
  );
}
