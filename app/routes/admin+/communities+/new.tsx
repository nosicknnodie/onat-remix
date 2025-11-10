import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { NewBoardForm } from "~/features/communities/client";
import { adminValidators } from "~/features/communities/isomorphic";
import { adminService } from "~/features/communities/server";
import { parseRequestData } from "~/libs/index.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const raw = await parseRequestData(request);
  const parsed = adminValidators.parseCreateBoard(raw);
  if (!parsed.ok) {
    return Response.json({ success: false, errors: parsed.errors }, { status: 400 });
  }
  try {
    const res = await adminService.createBoard(parsed.data);
    if (res.id) {
      return redirect("../");
    }
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
  }
  return null;
};

interface ICommunitiesNewPageProps {}

const CommunitiesNewPage = (_props: ICommunitiesNewPageProps) => {
  return (
    <>
      <div className="w-full">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="../">커뮤니티 관리</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>게시판 생성</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <NewBoardForm />
      </div>
    </>
  );
};

export default CommunitiesNewPage;
