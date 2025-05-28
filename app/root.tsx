import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  useLoaderData,
} from "@remix-run/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/ko"; // 한국어 locale import
import { User } from "lucia";
import { type ReactNode, useEffect, useState } from "react";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import { getUser } from "~/libs/db/lucia.server";
import ProgressBar from "./components/ProgressBar";
import { UserContext } from "./contexts/AuthUserContext";
import "./tailwind.css";
import Header from "./template/layout/Header";

dayjs.locale("ko"); // 전역 locale 설정

export const meta: MetaFunction = () => {
  return [{ title: "ONSOA | 홈" }, { name: "description", content: "축구 관리앱 입니다." }];
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "apple-touch-icon", href: "/favicon.ico?v=1" },
  { rel: "apple-touch-icon-precomposed", href: "/favicon.ico?v=1" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUser(request);
  return data({
    user,
    env: { PUBLIC_MAP_KAKAO_JAVASCRIPT_API_KEY: process.env.PUBLIC_MAP_KAKAO_JAVASCRIPT_API_KEY },
  });
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background font-pretendard antialiased">
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          <div className="flex h-screen overflow-hidden">
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient();

export default function App() {
  const data = useLoaderData<typeof loader>();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const appKey = data?.env?.PUBLIC_MAP_KAKAO_JAVASCRIPT_API_KEY ?? "";
  useKakaoLoader({
    appkey: appKey,
  });
  useEffect(() => {
    data.user.then(setUser);
  }, [data.user]);
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <UserContext.Provider value={user}>
          <Header />
          <ProgressBar />
          <Outlet />
        </UserContext.Provider>
      </QueryClientProvider>
    </>
  );
}
