import { useParams } from "@remix-run/react";

interface IClubPageProps {}

const ClubPage = (_props: IClubPageProps) => {
  const params = useParams();
  return <>ClubPage {params.id}</>;
};

export default ClubPage;
