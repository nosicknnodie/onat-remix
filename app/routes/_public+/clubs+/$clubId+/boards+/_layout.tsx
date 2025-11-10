import { Outlet, type ShouldRevalidateFunction, useParams } from "@remix-run/react";
import ItemLink from "~/components/ItemLink";
import { useClubBoardsTabsQuery } from "~/features/clubs/isomorphic";
export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};
// export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
//   const clubId = params.clubId;
//   const boards = clubId ? await boardService.getBoardTabs(clubId) : [];

//   return { boards, clubId };
// };

interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  // const data = useLoaderData<typeof loader>();
  const { clubId } = useParams();
  if (!clubId) {
    throw new Error("clubId is missing from route params");
  }
  const { data: boards } = useClubBoardsTabsQuery(clubId);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-wrap gap-3 border-b pb-2">
        <ItemLink to={`/clubs/${clubId}/boards`} end>
          전체
        </ItemLink>
        {boards?.map((board) => (
          <ItemLink key={board.id} to={`/clubs/${board.clubId}/boards/${board.slug}`}>
            {board.name}
          </ItemLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
};

export default Layout;
