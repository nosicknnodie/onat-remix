/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet } from "@remix-run/react";
import { boardService } from "~/features/clubs/server";

export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const slug = params.slug;
  const clubId = params.clubId;
  if (!clubId || !slug) {
    return { board: null };
  }
  const board = await boardService.getBoardBySlug(clubId, slug);
  return { board };
};

export const handle = {
  breadcrumb: (match: { data: any }) => {
    return (
      <Link to={`/clubs/${match.data?.board?.clubId}/boards/${match.data?.board?.slug}`}>
        {match.data?.board?.name || "게시판"}
      </Link>
    );
  },
};

export default function Layout() {
  return (
    <>
      <Outlet />
    </>
  );
}
