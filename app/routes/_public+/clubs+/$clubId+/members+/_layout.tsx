import { Outlet, useParams } from "@remix-run/react";
import ItemLink from "~/components/ItemLink";

interface ILayoutProps {}

export const handle = { breadcrumb: "멤버" };

const Layout = (_props: ILayoutProps) => {
  const { clubId } = useParams();
  if (!clubId) {
    throw new Error("clubId is missing from route params");
  }
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-wrap gap-3 border-b pb-2">
        <ItemLink to={`/clubs/${clubId}/members/approved`}>가입 회원</ItemLink>
        <ItemLink to={`/clubs/${clubId}/members/pendings`}>가입 대기</ItemLink>
      </div>
      <Outlet />
    </div>
  );
};

export default Layout;
