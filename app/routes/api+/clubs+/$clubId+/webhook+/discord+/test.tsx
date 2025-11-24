import type { ActionFunctionArgs } from "@remix-run/node";
import { utils } from "~/features/clubs/server";
import { getUser } from "~/libs/db/lucia.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!params.clubId) {
    return Response.json({ error: "clubId is required" }, { status: 400 });
  }

  let webhookUrl: string | null = null;
  let message: string = "ONSOA 디스코드 웹훅 테스트 메시지입니다.";

  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as {
      webhookUrl?: string;
      message?: string;
    };
    webhookUrl = body.webhookUrl ?? null;
    if (body.message) message = body.message;
  } else {
    const formData = await request.formData();
    webhookUrl = formData.get("webhookUrl")?.toString() ?? null;
    message = formData.get("message")?.toString() || message;
  }

  const validatedWebhookUrl = utils.sanitizeDiscordWebhook(webhookUrl);
  if (!validatedWebhookUrl) {
    return Response.json({ error: "유효한 Discord Webhook URL이 필요합니다." }, { status: 400 });
  }

  const safeMessage = message.slice(0, 2000); // Discord 메시지 제한

  try {
    const res = await fetch(validatedWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: safeMessage }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return Response.json({ error: "Webhook request failed", detail: text }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Webhook request failed" }, { status: 500 });
  }
};
