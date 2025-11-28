import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useParams } from "@remix-run/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { MercenaryFormValues } from "~/features/matches/isomorphic";
import { mercenaryQueryKeys, useUpdateMercenaryMutation } from "~/features/matches/isomorphic";
import { postJson } from "~/libs/client/api-client";
import { cn } from "~/libs/isomorphic";
import HistoryDrawer, { type MercenaryPayloadWithAttendances } from "./HistoryDrawer";
import InfoDrawer, { type MercenaryPayload } from "./InfoDrawer";
import SetMercenaryDialog from "./New/SetMercenaryDialog";

type ActionsPayload = MercenaryPayload | (MercenaryPayload & MercenaryPayloadWithAttendances);

const Actions = ({ payload }: { payload: ActionsPayload }) => {
  const { clubId } = useParams();
  const queryClient = useQueryClient();
  const { mutateAsync: updateMercenary } = useUpdateMercenaryMutation(clubId);
  const toggleMercenaryAttendance = useMutation<
    unknown,
    unknown,
    { matchClubId: string; mercenaryId: string; isVote: boolean }
  >({
    mutationFn: async (input) => postJson("/api/attendances/mercenary", input),
    onSuccess: async () => {
      if (clubId) {
        await queryClient.invalidateQueries({ queryKey: mercenaryQueryKeys.list(clubId) });
      }
    },
  });

  const defaultPositions = usePositionsFromPayload(payload);

  const handleUpdate = async (values: MercenaryFormValues) => {
    const res = await updateMercenary({
      mercenaryId: payload.id,
      ...values,
    });
    return res.ok;
  };

  const upcomingAttendances =
    "attendances" in payload
      ? (payload.attendances ?? [])
          .filter(
            (at) =>
              at.matchClub?.match?.stDate && new Date(at.matchClub.match.stDate) >= new Date(),
          )
          .sort(
            (a, b) =>
              new Date(a.matchClub.match.stDate as string).getTime() -
              new Date(b.matchClub.match.stDate as string).getTime(),
          )
      : [];

  return (
    <>
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
            >
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{`${payload.user?.name || payload.name || ""} 님`}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <InfoDrawer payload={payload}>정보확인</InfoDrawer>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>매칭참여</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-56">
                {upcomingAttendances.length > 0 ? (
                  upcomingAttendances.map((at, idx) => (
                    <DropdownMenuCheckboxItem
                      checked={at.isVote}
                      disabled={toggleMercenaryAttendance.isPending}
                      key={`${payload.id}-upcoming-${idx}`}
                      className="flex flex-col items-start justify-center space-y-1 whitespace-normal"
                      onCheckedChange={async (checked) => {
                        await toggleMercenaryAttendance.mutateAsync({
                          matchClubId: (at as { matchClubId?: string }).matchClubId ?? "",
                          mercenaryId: payload.id,
                          isVote: Boolean(checked),
                        });
                      }}
                    >
                      <span className={cn("font-medium", { "text-primary": at.isVote })}>
                        {at.matchClub?.match?.title ?? "매치 없음"}
                      </span>
                      <span
                        className={cn("text-xs text-muted-foreground", {
                          "text-primary": at.isVote,
                        })}
                      >
                        {at.matchClub?.match?.stDate
                          ? new Date(at.matchClub.match.stDate).toLocaleString()
                          : "-"}
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>다가오는 매칭이 없습니다</DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {"attendances" in payload && (
              <DropdownMenuItem>
                <HistoryDrawer payload={payload as MercenaryPayloadWithAttendances}>
                  최근경기
                </HistoryDrawer>
              </DropdownMenuItem>
            )}
            <SetMercenaryDialog
              defaultValues={{
                name: payload.user?.name ?? payload.name ?? "",
                description: payload.description ?? "",
                hp: payload.hp ?? "",
                positions: defaultPositions,
                userId: (payload as { user?: { id?: string } }).user?.id,
              }}
              onSubmit={handleUpdate}
              submitLabel="수정"
              title="용병 정보 수정"
            >
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                정보수정
              </DropdownMenuItem>
            </SetMercenaryDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default Actions;

function usePositionsFromPayload(payload: ActionsPayload): string[] {
  const positionsFromUser = payload.user
    ? _.compact([
        (payload.user as { position1?: string | null })?.position1 || null,
        (payload.user as { position2?: string | null })?.position2 || null,
        (payload.user as { position3?: string | null })?.position3 || null,
      ])
    : [];
  if (positionsFromUser.length > 0) return positionsFromUser;
  return _.compact([
    payload.position1 || null,
    payload.position2 || null,
    payload.position3 || null,
  ]);
}
