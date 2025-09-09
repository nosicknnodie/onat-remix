import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser, type Page } from "playwright";

// This e2e test uses Playwright programmatically under Vitest to capture
// browser console messages when visiting the Team route. Ensure your Remix
// app is running locally before running this test (default: http://localhost:3000).

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const MATCH_ID = process.env.E2E_MATCH_ID ?? "m1"; // adjust to an existing match id
const MATCH_CLUB_ID = process.env.E2E_MATCH_CLUB_ID ?? "c1"; // adjust to an existing match-club id

describe("Team page renders (no console errors)", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  it("renders team page UI and no console errors", async () => {
    const messages: { type: string; text: string }[] = [];
    page.on("console", (msg) => messages.push({ type: msg.type(), text: msg.text() }));

    const url = `${BASE_URL}/matches/${MATCH_ID}/clubs/${MATCH_CLUB_ID}/team`;
    const response = await page.goto(url);
    await page.waitForLoadState("networkidle");

    const finalUrl = page.url();
    const status = response?.status();

    // Basic navigation sanity
    expect(status, `Unexpected HTTP status ${status} for ${finalUrl}`).toBeLessThan(400);
    expect(!/\/404$/.test(finalUrl), `Navigated to 404: ${finalUrl}`).toBe(true);

    // Hydration check
    const hasRemixManifest = await page.evaluate(() => !!(window as any).__remixManifest);
    expect(hasRemixManifest).toBe(true);

    // UI presence checks
    const hasTeamTab = await page.locator('a:has-text("Team")').first().isVisible();
    expect(hasTeamTab).toBe(true);
    // “팀 수정” 버튼이 최소 한 개는 보여야 한다 (팀 카드 헤더)
    const editButtons = page.getByRole('button', { name: '팀 수정' });
    await expect(editButtons.first()).resolves.toBeDefined();

    // No console errors
    const errors = messages.filter((m) => m.type === 'error');
    expect(errors, `Console errors found: ${errors.map((e) => e.text).join(' | ')}`).toHaveLength(0);
  });
});
