const ALLOWED_DISCORD_HOSTS = [
  "discord.com",
  "discordapp.com",
  "ptb.discord.com",
  "canary.discord.com",
];

export const sanitizeDiscordWebhook = (urlString?: string | null) => {
  if (!urlString) return null;
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "https:") return null;
    if (!ALLOWED_DISCORD_HOSTS.includes(parsed.hostname)) return null;
    if (!parsed.pathname.startsWith("/api/webhooks/")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};
