/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import { BreadcrumbLink } from "~/components/ui/breadcrumb";

export const handle = {
  breadcrumb: (match: any) => {
    const params = match.params;
    return <BreadcrumbLink to={`/clubs/${params.clubId}/matches`}>매치</BreadcrumbLink>;
  },
};
