import type { PositionType } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { service as mercenaryService } from "~/features/matches/mercenaries/index.server";
import AddMercenary from "~/features/matches/ui/mercenaries/New/AddMercenary";
import EmailSearch from "~/features/matches/ui/mercenaries/New/EmailSearch";
import { NewMercenaryContext, useNewMercenary } from "~/features/matches/ui/mercenaries/New/hook";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) return Response.json({ error: "잘못된 요청입니다." }, { status: 422 });
  const formData = await request.formData();
  const actionType = formData.get("actionType")?.toString();
  const email = formData.get("email")?.toString();
  const name = formData.get("name")?.toString();
  const hp = formData.get("hp")?.toString();
  const userId = formData.get("userId")?.toString();
  const description = formData.get("description")?.toString();
  const position1 = (formData.get("position1")?.toString() as PositionType) || null;
  const position2 = (formData.get("position2")?.toString() as PositionType) || null;
  const position3 = (formData.get("position3")?.toString() as PositionType) || null;

  if (actionType === "email" && email) {
    const user = await mercenaryService.findUserForMercenaryByEmail(email);
    return Response.json({ user: user ?? null });
  }
  await mercenaryService.createMercenaryForMatchClub({
    matchClubId,
    name: name || null,
    description: description || null,
    hp: hp || null,
    userId: userId || null,
    position1: position1 || null,
    position2: position2 || null,
    position3: position3 || null,
  });
  const club = await mercenaryService.getMatchClub(matchClubId);
  return club
    ? Response.redirect(`/matches/${club.matchId}/clubs/${matchClubId}/mercenaries`)
    : Response.json({ error: "클럽 정보를 찾을 수 없습니다." }, { status: 404 });
};

interface IMercenaryNewPageProps {}

const MercenaryNewPage = (_props: IMercenaryNewPageProps) => {
  const hooks = useNewMercenary();
  const fetcher = hooks.fetcher;
  return (
    <>
      <NewMercenaryContext.Provider value={hooks}>
        <fetcher.Form method="post">
          <EmailSearch />
        </fetcher.Form>
        <fetcher.Form method="post" className="space-y-2">
          <AddMercenary />
        </fetcher.Form>
      </NewMercenaryContext.Provider>
    </>
  );
};

export default MercenaryNewPage;
