import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { clearDemoSession, signInAsAdmin, skipSplashForSession } from "./helpers/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.join(__dirname, "screens");
const docsScreensDir = path.join(__dirname, "../../docs/screenshots");

async function resetStores(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem("triage-case-engine");
      localStorage.removeItem("triage-ui-prefs");
    } catch {
      // ignore
    }
  });
}

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    errors.push(err.message);
  });
  return errors;
}

test.describe("Phase 9 guide, annotations, section 12", () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoSession(page);
    await skipSplashForSession(page);
    await signInAsAdmin(page);
    await resetStores(page);
    await page.reload({ waitUntil: "networkidle" });
  });

  test("Guide coach marks on Case 1 with required first line", async ({ page }) => {
    await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });

    await expect(page.getByTestId("guide-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("guide-coach")).toBeVisible();
    await expect(page.getByTestId("guide-what")).toContainText(
      "Do not open logs yet. First find out when it started, who is affected, and what changed.",
    );

    // Coach docks bottom-right and must not block the real control.
    await page.getByTestId("intake-acknowledge").click({ timeout: 5000 });
    await expect(page.getByTestId("step-scope")).toBeVisible();

    await page.getByTestId("guide-next").click();
    await expect(page.getByTestId("guide-coach")).toBeVisible();
    await expect(page.getByTestId("guide-what")).toContainText("Ask When and Who");

    await page.getByTestId("guide-do-it").click();
    await expect(page.getByTestId("scope-summary-when")).not.toContainText(
      "Not answered yet",
      { timeout: 5000 },
    );

    await page.getByTestId("guide-skip").click();
    await expect(page.getByTestId("guide-coach")).toHaveCount(0);

    await page.screenshot({
      path: path.join(screensDir, "guide-case1-scope.png"),
      fullPage: false,
    });
  });

  test("Guide resumes where left off after navigation", async ({ page }) => {
    await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });
    await page.getByTestId("guide-next").click();
    await page.getByTestId("guide-next").click();
    await expect(page.getByTestId("guide-what")).toContainText("Block-QUIC");

    await page.goto("/home", { waitUntil: "networkidle" });
    await expect(page.getByTestId("guide-coach")).toHaveCount(0);

    await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });
    await expect(page.getByTestId("guide-coach")).toBeVisible();
    await expect(page.getByTestId("guide-what")).toContainText("Block-QUIC");
  });

  test("Guide coach marks on Case 2", async ({ page }) => {
    await page.goto("/tickets/TKT-24823", { waitUntil: "networkidle" });
    await expect(page.getByTestId("guide-coach")).toBeVisible();
    await expect(page.getByTestId("guide-what")).toContainText("Pune");
    await page.getByTestId("guide-do-it").click();
    await expect(page.getByTestId("step-scope")).toBeVisible({ timeout: 5000 });
  });

  test("Annotations pins on Home, Tickets, Workspace with screenshots", async ({
    page,
  }) => {
    await page.getByTestId("annotations-toggle").click();
    await expect(page.getByTestId("annotations-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.goto("/home", { waitUntil: "networkidle" });
    await expect(page.getByTestId("annotations-layer")).toBeVisible();
    await expect(page.getByTestId("annotation-pin-1")).toBeVisible();
    await expect(page.getByTestId("annotation-pin-7")).toBeVisible();
    await page.getByTestId("annotation-pin-1").click();
    await expect(page.getByTestId("annotation-card")).toBeVisible();
    await expect(page.getByTestId("annotation-design")).not.toBeEmpty();
    await expect(page.getByTestId("annotation-problem")).not.toBeEmpty();
    await expect(page.getByTestId("annotation-metric")).not.toBeEmpty();

    await page.screenshot({
      path: path.join(screensDir, "annotations-home.png"),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(docsScreensDir, "01-home-annotations.png"),
      fullPage: false,
    });

    await page.goto("/tickets", { waitUntil: "networkidle" });
    await expect(page.getByTestId("annotation-pin-1")).toBeVisible();
    await expect(page.getByTestId("annotation-pin-6")).toBeVisible();
    await page.getByTestId("annotation-pin-3").click();
    await expect(page.getByTestId("annotation-card")).toBeVisible();

    await page.screenshot({
      path: path.join(screensDir, "annotations-tickets.png"),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(docsScreensDir, "02-tickets-annotations.png"),
      fullPage: false,
    });

    await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });
    // Guide card may cover pins; turn guide off for a clean annotation shot.
    await page.getByTestId("guide-toggle").click();
    await expect(page.getByTestId("annotation-pin-1")).toBeVisible();
    await expect(page.getByTestId("annotation-pin-7")).toBeVisible();
    await page.getByTestId("annotation-pin-1").click();
    await expect(page.getByTestId("annotation-card")).toBeVisible();

    await page.screenshot({
      path: path.join(screensDir, "annotations-workspace.png"),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(docsScreensDir, "03-workspace-annotations.png"),
      fullPage: false,
    });
  });

  test("hard refresh on TKT-24823 does not 404", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/tickets/TKT-24823", { waitUntil: "networkidle" });
    await expect(page.getByTestId("ticket-workspace-title")).toHaveText("TKT-24823");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByTestId("ticket-workspace-title")).toHaveText("TKT-24823");
    await expect(page.getByText("Page not found")).toHaveCount(0);
    expect(errors, `Console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("section 12 nav pages still seeded with zero console errors", async ({
    page,
  }) => {
    const errors = await collectConsoleErrors(page);
    const routes: { path: string; probe: string }[] = [
      { path: "/home", probe: "home-grid" },
      { path: "/tickets", probe: "seeded-summary" },
      { path: "/logs", probe: "seeded-summary" },
      { path: "/policies", probe: "seeded-summary" },
      { path: "/objects", probe: "seeded-summary" },
      { path: "/remote-networks", probe: "seeded-summary" },
      { path: "/mobile-users", probe: "seeded-summary" },
      { path: "/config-audit", probe: "seeded-summary" },
      { path: "/troubleshooting", probe: "page-troubleshooting" },
      { path: "/brief", probe: "seeded-summary" },
    ];
    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await expect(page.getByTestId(route.probe)).toBeVisible();
    }
    expect(errors, `Console errors: ${errors.join(" | ")}`).toEqual([]);
  });
});
