import { useOutletContext } from "@remix-run/react";
import { MatchSummarySection } from "~/features/matches";
import type { MatchClubLayoutLoaderData } from "./_layout";

interface IMatchClubIdPageProps {}

const MatchClubIdPage = (_props: IMatchClubIdPageProps) => {
  const data = useOutletContext<MatchClubLayoutLoaderData>();
  return (
    <div className="space-y-6">
      {data.matchSummary.match.description ? (
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {data.matchSummary.match.description}
        </p>
      ) : null}
      <MatchSummarySection summaries={data.matchSummary.summaries} highlight={data.summary} />
    </div>
  );
};

export default MatchClubIdPage;
