import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { clearDemoSession, signInAsAdmin, skipSplashForSession } from "./helpers/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.join(__dirname, "screens");

async function resetCaseEngine(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem("triage-case-engine");
    } catch {
      // ignore
    }
  });
}

test.describe("Phase 4 tickets and workspace", () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoSession(page);
    await skipSplashForSession(page);
    await signInAsAdmin(page);
    await resetCaseEngine(page);
  });

  test("tickets grid shows workable and history; open both; hard refresh", async ({
    page,
  }) => {
    await page.goto("/tickets?tab=all", { waitUntil: "networkidle" });
    await expect(page.getByTestId("tickets-page")).toBeVisible();
    await expect(page.getByTestId("ticket-card-TKT-24817")).toBeVisible();
    await expect(page.getByTestId("ticket-card-TKT-24823")).toBeVisible();
    await expect(page.getByTestId("ticket-card-TKT-24700")).toBeVisible();
    await expect(page.getByTestId("seeded-summary")).toContainText("12");

    await page.goto("/tickets?tab=active", { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(screensDir, "tickets-grid.png"),
      fullPage: false,
    });

    await page.getByTestId("ticket-card-TKT-24817").click();
    await expect(page).toHaveURL(/\/tickets\/TKT-24817$/);
    await expect(page.getByTestId("ticket-workspace")).toBeVisible();
    await expect(page.getByTestId("step-intake")).toBeVisible();

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByTestId("ticket-workspace")).toBeVisible();
    await expect(page.getByTestId("ticket-workspace-title")).toHaveText("TKT-24817");

    await page.goto("/tickets?tab=active", { waitUntil: "networkidle" });
    await page.getByTestId("ticket-card-TKT-24823").click();
    await expect(page).toHaveURL(/\/tickets\/TKT-24823$/);
    await expect(page.getByTestId("ticket-workspace")).toBeVisible();

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByTestId("ticket-workspace-title")).toHaveText("TKT-24823");
  });

  test("Case 1 Intake and Scope with answers; screenshots", async ({ page }) => {
    await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });
    await expect(page.getByTestId("step-intake")).toBeVisible();

    await page.screenshot({
      path: path.join(screensDir, "workspace-intake.png"),
      fullPage: false,
    });

    await page.getByTestId("intake-acknowledge").click();
    await expect(page.getByTestId("step-scope")).toBeVisible();
    await expect(page.getByTestId("playbook-step-intake")).toHaveAttribute(
      "data-state",
      "done",
    );

    const scopeQuestions = [
      "what_fails",
      "when",
      "who",
      "changes",
      "consistent",
      "other_apps",
      "examples",
      "workaround",
    ];

    for (const id of scopeQuestions) {
      await page.getByTestId(`scope-ask-${id}`).click();
      await expect(page.getByTestId("typing-indicator")).toBeVisible();
      await expect(page.getByTestId(`scope-question-${id}`)).toContainText("Answered", {
        timeout: 5000,
      });
    }

    await expect(page.getByTestId("scope-summary-when")).not.toContainText(
      "Not answered yet",
    );
    await expect(page.getByTestId("scope-summary-who")).not.toContainText(
      "Not answered yet",
    );
    await expect(page.getByTestId("playbook-step-evidence")).toHaveAttribute(
      "data-state",
      "unlocked",
    );

    await page.getByTestId("scope-key-changes").click();
    await expect(page.getByTestId("scope-key-changes")).toContainText("Key finding");

    await page.getByTestId("scope-summary").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(screensDir, "workspace-scope.png"),
      fullPage: false,
    });
  });

  test("unknown ticket id shows designed not-found", async ({ page }) => {
    await page.goto("/tickets/TKT-99999", { waitUntil: "networkidle" });
    await expect(page.getByTestId("ticket-not-found")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ticket not found" })).toBeVisible();
    await page.getByRole("link", { name: "Back to Tickets" }).click();
    await expect(page).toHaveURL(/\/tickets/);
  });

  test("history ticket opens read-only RCA workspace", async ({ page }) => {
    await page.goto("/tickets?tab=resolved", { waitUntil: "networkidle" });
    await page.getByTestId("ticket-card-TKT-24700").click();
    await expect(page.getByTestId("ticket-workspace-history")).toBeVisible();
    await expect(page.getByTestId("history-rca")).toBeVisible();
    await expect(page.getByTestId("ticket-thread")).toBeVisible();
  });
});
