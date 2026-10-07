import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { clearDemoSession, signInAsAdmin, skipSplashForSession } from "./helpers/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.join(__dirname, "screens");

const tileLinks: { testId: string; expectPath: RegExp; expectText: RegExp }[] = [
  {
    testId: "tile-my-tickets-link",
    expectPath: /\/tickets\?tab=active/,
    expectText: /tickets seeded|TKT-24817/i,
  },
  {
    testId: "tile-platform-health-link",
    expectPath: /\/remote-networks\?status=down/,
    expectText: /remote networks|Pune/i,
  },
  {
    testId: "tile-recent-config-link",
    expectPath: /\/config-audit\?window=24h/,
    expectText: /config changes|CHG-/i,
  },
  {
    testId: "tile-top-blocked-link",
    expectPath: /\/logs\?app=stun&action=drop/,
    expectText: /log rows|stun/i,
  },
  {
    testId: "tile-traffic-trend-link",
    expectPath: /\/logs\?device=prisma-rn-india-west&site=pune/,
    expectText: /log rows|traffic/i,
  },
  {
    testId: "tile-platform-alerts-link",
    expectPath: /\/alerts\?status=open/,
    expectText: /platform alerts|ALT-/i,
  },
];

test.describe("Phase 3 shell and home", () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoSession(page);
    await skipSplashForSession(page);
    await signInAsAdmin(page);
  });

  test("home renders all tiles with seeded data", async ({ page }) => {
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByTestId("home-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();

    await expect(page.getByTestId("tile-my-tickets")).toBeVisible();
    await expect(page.getByTestId("active-ticket-TKT-24817")).toBeVisible();
    await expect(page.getByTestId("active-ticket-TKT-24823")).toBeVisible();

    await expect(page.getByTestId("tile-platform-health")).toBeVisible();
    await expect(page.getByTestId("pune-health")).toContainText("Pune-Branch-01 down");
    await expect(page.getByTestId("mu-connected-count")).not.toHaveText("0");

    await expect(page.getByTestId("tile-recent-config")).toBeVisible();
    await expect(page.getByTestId("config-CHG-5120")).toBeVisible();
    await expect(page.getByTestId("config-CHG-4471")).toBeVisible();

    await expect(page.getByTestId("tile-top-blocked")).toBeVisible();
    await expect(page.getByTestId("blocked-apps-chart")).toBeVisible();
    await expect(page.getByTestId("tile-top-blocked")).toContainText("stun");

    await expect(page.getByTestId("tile-traffic-trend")).toBeVisible();
    await expect(page.getByTestId("traffic-trend-chart")).toBeVisible();
    await expect(page.getByTestId("tile-traffic-trend")).toContainText("11:42");

    await expect(page.getByTestId("tile-platform-alerts")).toBeVisible();
    await expect(page.getByTestId("alert-ALT-88421")).toBeVisible();

    await page.screenshot({
      path: path.join(screensDir, "home.png"),
      fullPage: false,
    });
  });

  test("each home tile link lands on a non-empty page", async ({ page }) => {
    for (const link of tileLinks) {
      await page.goto("/home", { waitUntil: "networkidle" });
      await page.getByTestId(link.testId).click();
      await expect(page).toHaveURL(link.expectPath);
      await expect(page.getByTestId("seeded-summary")).toBeVisible();
      await expect(page.getByTestId("seeded-summary")).toContainText(link.expectText);
      await expect(page.getByTestId("active-filters")).toBeVisible();
    }
  });

  test("command palette opens a ticket by id", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.getByTestId("command-palette")).toBeVisible();
    await page.getByTestId("command-palette-input").fill("TKT-24817");
    await page.getByTestId("palette-ticket-TKT-24817").click();
    await expect(page).toHaveURL(/\/tickets\/TKT-24817$/);
    await expect(page.getByRole("heading", { name: "Ticket workspace" })).toBeVisible();
  });
});
