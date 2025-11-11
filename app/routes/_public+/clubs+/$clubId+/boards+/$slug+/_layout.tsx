import { Outlet } from "@remix-run/react";

// export const handle = {
//   breadcrumb: (match: { params: { clubId?: string; slug?: string } }) => {
//     return (
//       <Link to={`/clubs/${match.params.clubId}/boards/${match.params.slug}`}>
//         {match.params.slug ?? "게시판"}
//       </Link>
//     );
//   },
// };

export default function Layout() {
  return (
    <div className="flex flex-col gap-4">
      <Outlet />
    </div>
  );
}
