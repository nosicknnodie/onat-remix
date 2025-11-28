import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { parseCreate } from "~/features/matches/isomorphic";
import { createService } from "~/features/matches/server";
import { getUser, parseRequestData } from "~/libs/server";
import { jsonFail } from "~/utils/action.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/auth/login");
  }
  const raw = await parseRequestData(request);
  const parsed = parseCreate(raw);
  if (!parsed.ok) return jsonFail("잘못된 요청입니다.", { formErrors: ["INVALID_INPUT"] });
  const { title, description, clubId, date, hour, minute, placeName, address, lat, lng, isSelf } =
    parsed.data;
  const stDate = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
  const res = await createService.createMatch({
    clubId,
    title,
    description,
    stDate,
    placeName: placeName?.toString() ?? "",
    address: address?.toString() ?? "",
    lat: lat ? Number.parseFloat(lat) : null,
    lng: lng ? Number.parseFloat(lng) : null,
    isSelf: isSelf === "on",
    createUserId: user.id,
  });
  if (!res.ok) return jsonFail("요청을 처리할 수 없습니다.");
  return Response.json(res);
};
