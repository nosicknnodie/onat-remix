import dayjs from "dayjs";
import { utils } from "~/features/clubs/server";
import { prisma } from "~/libs/db/db.server";

type MatchWebhookAction = "created" | "updated" | "deleted";

const buildMessage = (params: {
  action: MatchWebhookAction;
  title: string;
  stDate: Date;
  place: string;
  url?: string | null;
}) => {
  const lines = [
    `📌 매치: ${params.title}`,
    `📅 일시: ${dayjs(params.stDate).format("YYYY-MM-DD (ddd) HH:mm")}`,
    `📍 장소: ${params.place || "-"}`,
  ];
  if (params.url) {
    lines.push(`🔗 자세히 보기: ${params.url}`);
  }
  lines.push("----------------------");
  return lines.join("\n");
};

const getMessageEndpoint = (webhookUrl: string, messageId?: string | null) => {
  if (!messageId) return `${webhookUrl}?wait=true`;
  const url = new URL(webhookUrl);
  // /api/webhooks/{id}/{token}
  url.pathname = `${url.pathname.replace(/\/$/, "")}/messages/${messageId}`;
  url.search = ""; // wait는 수정/삭제에 불필요
  return url.toString();
};

export async function sendMatchWebhook(input: { matchClubId: string; action: MatchWebhookAction }) {
  const matchClub = await prisma.matchClub.findUnique({
    where: { id: input.matchClubId },
    include: {
      match: true,
      club: true,
    },
  });
  if (!matchClub || !matchClub.match || !matchClub.club?.discordWebhook) return null;

  const sanitizedWebhook = utils.sanitizeDiscordWebhook(matchClub.club.discordWebhook);
  if (!sanitizedWebhook) return null;

  const siteUrl = process.env.SITE_URL || process.env.APP_URL || "";
  const matchUrlBase = `${siteUrl}`.trim().replace(/\/$/, "");
  const matchUrl = matchUrlBase
    ? `${matchUrlBase}/clubs/${matchClub.clubId}/matches/${matchClub.id}`
    : `/clubs/${matchClub.clubId}/matches/${matchClub.id}`;

  const content = buildMessage({
    action: input.action,
    title: matchClub.match.title,
    stDate: new Date(matchClub.match.stDate),
    place: matchClub.match.placeName || "",
    url: matchUrl,
  });

  const messageId = matchClub.discordWebhookMessageId;
  const endpoint = getMessageEndpoint(sanitizedWebhook, messageId);
  const method = input.action === "deleted" && messageId ? "DELETE" : messageId ? "PATCH" : "POST";
  const body = method === "DELETE" ? undefined : JSON.stringify({ content });

  try {
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) return null;

    if (method === "DELETE") {
      await prisma.matchClub.update({
        where: { id: matchClub.id },
        data: { discordWebhookMessageId: null },
      });
      return null;
    }

    // PATCH 시 Discord는 200 + message json 반환
    // POST 시 wait=true 로 message json 반환
    const json = (await res.json().catch(() => null)) as { id?: string } | null;
    const newMessageId = json?.id ?? messageId ?? null;
    if (newMessageId !== matchClub.discordWebhookMessageId) {
      await prisma.matchClub.update({
        where: { id: matchClub.id },
        data: { discordWebhookMessageId: newMessageId },
      });
    }
    return newMessageId;
  } catch (error) {
    console.error("[sendMatchWebhook]", error);
    return null;
  }
}
