import { Outlet, useOutletContext, useParams } from "@remix-run/react";
import ItemLink from "~/components/ItemLink";
import { loader as layoutLoader } from "../../_layout";

interface IMatchClubIdLayoutProps {}

type IParentLayoutOutletContext = Awaited<ReturnType<typeof layoutLoader>>;
type IMatchClub = IParentLayoutOutletContext["match"]["matchClubs"][number];

export type IMatchClubIdLayoutOutletContext = IParentLayoutOutletContext & {
  matchClub: IMatchClub;
};

const MatchClubIdLayout = (_props: IMatchClubIdLayoutProps) => {
  const outletData = useOutletContext<IParentLayoutOutletContext>();
  const params = useParams();
  const matchClub = outletData?.match?.matchClubs?.find((mc) => mc.id === params.matchClubId);
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
      <Outlet context={{ ...outletData, matchClub }} />
    </>
  );
};

export default MatchClubIdLayout;
