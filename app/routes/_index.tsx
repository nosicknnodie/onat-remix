import type { MetaFunction } from "@remix-run/node";
import type { ReactNode } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <main className="">
            {/* <Header /> */}
            <div className="mx-auto max-w-screen-lg p-4 md:p-6 2xl:p-10 flex justify-center items-start">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default function Index() {
  return (
    <div>
      <div className="max-w-5xl w-full items-start font-mono text-sm space-y-4">
        <span>asdfasdfasdf</span>
      </div>
    </div>
  );
}
