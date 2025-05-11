import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useParams } from "@remix-run/react";
import ItemLink from "~/components/ItemLink";
import { getUser } from "~/libs/db/lucia.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  return Response.json({});
};

interface IMatchClubIdLayoutProps {}

const MatchClubIdLayout = (_props: IMatchClubIdLayoutProps) => {
  const params = useParams();
  return (
    <>
      <div className="flex gap-x-4 p-2">
        <ItemLink to={`/matches/${params.id}/clubs/${params.matchClubId}`} end>
          정보
        </ItemLink>
        <ItemLink to={`/matches/${params.id}/clubs/${params.matchClubId}/attendance`}>
          참석
        </ItemLink>
        <ItemLink to={`/matches/${params.id}/clubs/${params.matchClubId}/position`}>
          포지션
        </ItemLink>
        <ItemLink to={`/matches/${params.id}/clubs/${params.matchClubId}/record`}>기록</ItemLink>
        <ItemLink to={`/matches/${params.id}/clubs/${params.matchClubId}/rating`}>MOM</ItemLink>
      </div>
      <Outlet />
    </>
  );
};

export default MatchClubIdLayout;
