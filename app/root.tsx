import type { Profile } from "@prisma/client";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  useLoaderData,
} from "@remix-run/react";
import type { ReactNode } from "react";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { ProfileContext, UserContext } from "./contexts/AuthUserContext";
import "./tailwind.css";
import Header from "./template/layout/Header";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "apple-touch-icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon-precomposed", href: "/favicon.ico" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  let profile: Profile | null = null;
  if (user?.id) {
    profile = await prisma.profile.findUnique({
      where: { userId: user?.id },
    });
  }
  return data({ user, profile });
}

export function Layout({ children }: { children: ReactNode }) {
  const data = useLoaderData<typeof loader>();
  return (
    <UserContext.Provider value={data.user}>
      <ProfileContext.Provider value={data.profile}>
        <html lang="ko">
          <head>
            <meta charSet="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <Meta />
            <Links />
          </head>
          <body className="min-h-screen bg-background font-sans antialiased">
            <div className="dark:bg-boxdark-2 dark:text-bodydark">
              <div className="flex h-screen overflow-hidden">
                <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                  <Header />
                  <main className="mx-auto max-w-screen-lg p-4 md:p-6 2xl:p-10 flex justify-center items-start">
                    {children}
                  </main>
                </div>
              </div>
            </div>
            <ScrollRestoration />
            <Scripts />
          </body>
        </html>
      </ProfileContext.Provider>
    </UserContext.Provider>
  );
}

export default function App() {
  return <Outlet />;
}
