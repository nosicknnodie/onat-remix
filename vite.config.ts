import { vitePlugin as remix } from "@remix-run/dev";
import { flatRoutes } from "remix-flat-routes";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}
const isStorybook = process.env.STORYBOOK === "true";
export default defineConfig({
  plugins: [
    !isStorybook &&
      remix({
        routes: (defineRoutes) => {
          return flatRoutes("routes", defineRoutes, {
            ignoredRouteFiles: ["**/.*"],
          });
        },
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_singleFetch: true,
          v3_lazyRouteDiscovery: true,
        },
      }),
    svgr(),
    tsconfigPaths(),
  ].filter(Boolean),
  define: {
    "process.env.PUBLIC_MAP_KAKAO_JAVASCRIPT_API_KEY": `"${process.env.PUBLIC_MAP_KAKAO_JAVASCRIPT_API_KEY ?? ""}"` ,
  },
  server: {
    host: true,
    watch: {
      usePolling: true,
    },
  },
});
