import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type ShouldRevalidateFunction,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/ko"; // 한국어 locale import
import type { User } from "lucia";
import { OverlayProvider } from "overlay-kit";
import type { ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import { Toaster } from "~/components/ui/toaster";
import AdminHeader from "./components/layout/AdminHeader";
import Header from "./components/layout/Header";
import ProgressBar from "./components/ProgressBar";
import { SidebarProvider } from "./components/ui/sidebar";
import { UserContext } from "./contexts/AuthUserContext";
import "./tailwind.css";

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

export async function loader() {
  return {
    env: {
      PUBLIC_MAP_KAKAO_JAVASCRIPT_API_KEY: process.env.PUBLIC_MAP_KAKAO_JAVASCRIPT_API_KEY,
    },
  };
}

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};

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
        <div className="flex h-screen overflow-hidden">
          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient();

const CURRENT_USER_QUERY_KEY = ["current-user"] as const;

type CurrentUserResponse = {
  user: User | null;
};

const fetchCurrentUser = async (): Promise<User | null> => {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  const result = (await response.json()) as CurrentUserResponse;
  return result.user;
};

function useCurrentUserQuery(enabled: boolean) {
  return useQuery<User | null>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

export default function App() {
  return (
    <OverlayProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </OverlayProvider>
  );
}

function AppContent() {
  const loaderData = useLoaderData<typeof loader>();
  const location = useLocation();
  const appKey = loaderData.env.PUBLIC_MAP_KAKAO_JAVASCRIPT_API_KEY ?? "";
  const backendForDND =
    typeof window !== "undefined" && "ontouchstart" in window ? TouchBackend : HTML5Backend;
  useKakaoLoader({
    appkey: appKey,
  });
  const isBrowser = typeof window !== "undefined";
  const userQuery = useCurrentUserQuery(isBrowser);
  const isLoadingUser = !isBrowser || userQuery.isPending || userQuery.isFetching;
  const user = isLoadingUser ? undefined : (userQuery.data ?? null);
  const isAdminRoute = location.pathname.startsWith("/admin");
  return (
    <>
      <UserContext.Provider value={user}>
        <DndProvider
          backend={backendForDND}
          options={{
            enableKeyboardEvents: true,
            enableMouseEvents: true,
            enableTouchEvents: true,
          }}
        >
          <ProgressBar />
          <SidebarProvider>
            {isAdminRoute ? <AdminHeader /> : <Header />}

            <Outlet />
            <Toaster />
          </SidebarProvider>
        </DndProvider>
      </UserContext.Provider>
    </>
  );
}
