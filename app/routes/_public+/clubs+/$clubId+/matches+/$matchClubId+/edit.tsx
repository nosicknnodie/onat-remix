import { useNavigate, useParams } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useAtomCallback } from "jotai/utils";
import { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { placeHistoryAtom } from "~/atoms";
import { Button } from "~/components/ui/button";
import { confirm } from "~/components/ui/confirm";
import { useMembershipInfoQuery, usePlayerPermissionsQuery } from "~/features/clubs/isomorphic";
import { HistoryPlaceDownList, MatchForm, SearchPlace } from "~/features/matches/client";
import {
  type MatchFormFields,
  matchClubQueryKeys,
  useDeleteMatchClubMutation,
  useMatchClubQuery,
  useSaveMatchMutation,
} from "~/features/matches/isomorphic";
import { useToast } from "~/hooks";
import { type IKakaoLocalType, INITIAL_CENTER } from "~/libs";
import { postJson } from "~/libs/api-client";

export const handle = { breadcrumb: "매치 수정" };

interface IMatchEditPageProps {}

const MatchEditPage = (_props: IMatchEditPageProps) => {
  const params = useParams();
  const matchClubId = params.matchClubId;
  const clubId = params.clubId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: matchClubData, isLoading } = useMatchClubQuery(matchClubId, {
    clubId,
    enabled: Boolean(matchClubId),
  });
  const { toast } = useToast();
  const match = useMemo(() => matchClubData?.matchSummary?.match ?? null, [matchClubData]);
  const matchClub = matchClubData?.matchClub ?? null;
  const [place, setPlace] = useState<IKakaoLocalType | null>(null);
  const [isTogglingSelf, setIsTogglingSelf] = useState(false);
  const { mutateAsync: saveMatch } = useSaveMatchMutation({ matchClubId });
  const { mutateAsync: deleteMatchClub, isPending: isDeleting } = useDeleteMatchClubMutation();
  const { data: membership } = useMembershipInfoQuery(clubId ?? "", { enabled: Boolean(clubId) });
  const { data: permissions = [], isLoading: isLoadingPermissions } = usePlayerPermissionsQuery(
    membership?.id ?? "",
    { enabled: Boolean(membership?.id) },
  );
  const hasMatchMaster = permissions.includes("MATCH_MASTER");
  const hasMatchCreate = permissions.includes("MATCH_CREATE");
  const canDeleteByDate = match ? dayjs(match.stDate).diff(dayjs(), "day") >= 1 : false;
  const canDelete = hasMatchMaster || (hasMatchCreate && canDeleteByDate);
  const showDeleteButton = hasMatchMaster || hasMatchCreate;
  const isAdmin = hasMatchMaster || hasMatchCreate;
  useEffect(() => {
    if (!match) return;
    setPlace({
      address_name: match.address || "",
      place_name: match.placeName || "",
      y: String(match.lat || INITIAL_CENTER[0]),
      x: String(match.lng || INITIAL_CENTER[1]),
      place_url: "",
      road_address_name: "",
      category_group_code: "",
      category_group_name: "",
      category_name: "",
      distance: "",
      phone: "",
      id: "",
    });
  }, [match]);

  const handleSubmit = useAtomCallback(async (_get, set, values: MatchFormFields) => {
    set(placeHistoryAtom, (p) => {
      const preValue = p.find((d) => d.id === place?.id);
      if (preValue) {
        preValue.count = preValue.count ? preValue.count + 1 : 1;
      } else {
        if (place) return [...p, { ...place, count: 1 }];
      }
      return p;
    });
    await saveMatch({ payload: values, matchId: match?.id ?? "" });
    if (clubId && matchClubId) {
      navigate(`/clubs/${clubId}/matches/${matchClubId}`);
    }
  });

  const handleDelete = async () => {
    if (!matchClubId || !clubId) return;
    if (!canDelete) {
      toast({
        title: "삭제할 수 없습니다",
        description: "삭제 권한이 없거나 삭제 가능 기한이 지났습니다.",
        variant: "destructive",
      });
      return;
    }
    confirm({
      title: "매치를 삭제하시겠어요?",
      description: hasMatchMaster
        ? "삭제 후 되돌릴 수 없습니다."
        : "시작 1일 전까지만 삭제할 수 있습니다.",
      confirmText: "삭제",
      cancelText: "취소",
    }).onConfirm(async () => {
      try {
        await deleteMatchClub({ matchClubId });
        toast({ title: "매치를 삭제했습니다." });
        navigate(`/clubs/${clubId}/matches`);
      } catch (error) {
        console.error(error);
        toast({
          title: "삭제 중 오류가 발생했습니다.",
          description: "잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });
      }
    });
  };

  const handleToggleSelf = () => {
    if (!matchClubId || !matchClub) return;
    confirm({
      title: "매칭 타입변경 주의",
      description: `타입 변경시 포지션 및 골기록이 초기화됩니다. ${!matchClub.isSelf ? "자체전" : "매치전"}으로 타입을 변경하시겠습니까?`,
      confirmText: "타입 변경",
      cancelText: "취소",
    }).onConfirm(async () => {
      setIsTogglingSelf(true);
      try {
        await postJson(`/api/matchClubs/${matchClubId}/isSelf`, { isSelf: !matchClub.isSelf });
        await queryClient.invalidateQueries({
          queryKey: matchClubQueryKeys.detail(matchClubId),
        });
        toast({ title: "매치 타입을 변경했습니다." });
      } catch (error) {
        console.error(error);
        toast({
          title: "타입 변경 중 오류가 발생했습니다.",
          description: "잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });
      } finally {
        setIsTogglingSelf(false);
      }
    });
  };

  if (isLoading || !match) {
    return (
      <div className="py-10 flex justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleSearchPlaceSubmit = (value: IKakaoLocalType) => {
    setPlace(value);
  };
  const defaultMatch = {
    title: match.title,
    description: match.description ?? "",
    stDate: match.stDate,
    placeName: place?.place_name ?? match.placeName ?? "",
    address: place?.address_name ?? match.address ?? "",
    lat: place?.y ?? match.lat ?? "",
    lng: place?.x ?? match.lng ?? "",
  };

  return (
    <div className="flex flex-col justify-start w-full space-y-2">
      <MatchForm
        defaultMatch={defaultMatch}
        onSubmit={handleSubmit}
        renderPlaceControls={() => (
          <>
            <SearchPlace onSubmit={handleSearchPlaceSubmit}>
              <Button type="button" size="icon">
                <FaSearch />
              </Button>
            </SearchPlace>
            <HistoryPlaceDownList onSetPlace={handleSearchPlaceSubmit} />
          </>
        )}
      />
      {(showDeleteButton || isAdmin) && (
        <div className="flex justify-end pt-4 gap-2">
          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleToggleSelf()}
              disabled={isTogglingSelf}
            >
              {matchClub?.isSelf ? "자체전" : "매치전"}
            </Button>
          )}
          {showDeleteButton && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isDeleting || isLoadingPermissions || !canDelete}
            >
              {isDeleting ? "삭제 중..." : "매치 삭제"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchEditPage;
