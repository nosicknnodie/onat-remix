import { useParams } from "@remix-run/react";
import { Loading } from "~/components/Loading";
import { Pendings } from "~/features/clubs/client";
import { type ClubPendingMembers, useClubPendingMembersQuery } from "~/features/clubs/isomorphic";

export const handle = { breadcrumb: "가입대기" };

const PendingsPage = () => {
  const { clubId } = useParams();
  if (!clubId) {
    throw new Error("clubId is missing from route params");
  }

  const { data, isLoading, error, refetch } = useClubPendingMembersQuery(clubId);
  const players = (data ?? []) as ClubPendingMembers;
  const handleRefetch = async () => {
    await refetch();
  };

  if (error) {
    return (
      <div className="py-8 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <p>승인 대기 목록을 불러오지 못했습니다.</p>
        <button type="button" className="text-primary" onClick={() => void refetch()}>
          다시 시도하기
        </button>
      </div>
    );
  }

  if (isLoading && players.length === 0) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  return <Pendings players={players} refetch={handleRefetch} />;
};

export default PendingsPage;
