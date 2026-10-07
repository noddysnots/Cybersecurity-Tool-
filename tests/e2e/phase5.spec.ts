import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { clearDemoSession, signInAsAdmin, skipSplashForSession } from "./helpers/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.join(__dirname, "screens");

async function resetCaseEngine(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem("triage-case-engine");
    } catch {
      // ignore
    }
  });
}

async function reachEvidence(page: Page) {
  await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });
  await page.getByTestId("intake-acknowledge").click();
  await expect(page.getByTestId("step-scope")).toBeVisible();
  await page.getByTestId("scope-ask-all").click();
  await expect(page.getByTestId("scope-summary-when")).not.toContainText(
    "Not answered yet",
    { timeout: 8000 },
  );
  await expect(page.getByTestId("scope-summary-who")).not.toContainText(
    "Not answered yet",
  );
  await page.getByTestId("playbook-step-evidence").click();
  await expect(page.getByTestId("step-evidence")).toBeVisible();
  await expect(page.getByTestId("log-loading")).toBeHidden({ timeout: 5000 });
}

test.describe("Phase 5 evidence, compare, reproduce, logs", () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoSession(page);
    await skipSplashForSession(page);
    await signInAsAdmin(page);
    await resetCaseEngine(page);
  });

  test("Case 1 evidence shows Block-QUIC drops for ankit at 10:02", async ({
    page,
  }) => {
    await reachEvidence(page);

    await expect(page.getByTestId("config-strip-CHG-5120")).toBeVisible();
    await expect(page.getByTestId("log-row-log-traffic-ankit-100214")).toBeVisible();
    await expect(page.getByTestId("log-row-log-traffic-ankit-100214")).toContainText(
      "Block-QUIC",
    );
    await expect(page.getByTestId("log-row-log-traffic-ankit-100214")).toContainText(
      "ankit.verma@acme.io",
    );
    await expect(page.getByTestId("log-row-log-traffic-ankit-100214")).toContainText(
      "10:02:14",
    );

    await page.getByTestId("log-row-log-traffic-ankit-100214").click();
    await expect(page.getByTestId("log-detail-drawer")).toBeVisible();
    await page.getByTestId("log-detail-pin").click();
    await expect(page.getByTestId("evidence-list")).toContainText("ankit");
    await page.getByTestId("log-detail-drawer").getByLabel("Close detail").click();
    await page.getByTestId("log-query").scrollIntoViewIfNeeded();

    await page.screenshot({
      path: path.join(screensDir, "workspace-evidence.png"),
      fullPage: false,
    });
  });

  test("Case 1 compare highlights rule and container; reproduce adds rows", async ({
    page,
  }) => {
    await reachEvidence(page);
    await page.getByTestId("log-row-log-traffic-ankit-100214").click();
    await page.getByTestId("log-detail-pin").click();
    await page.getByTestId("evidence-continue").click();

    await expect(page.getByTestId("step-isolate")).toBeVisible();
    await expect(page.getByTestId("compare-failing")).toContainText("Block-QUIC");
    await expect(page.getByTestId("compare-failing")).toContainText("Mobile Users");
    await expect(page.getByTestId("compare-working")).toContainText("Allow-Collab-Apps");
    await expect(page.getByTestId("compare-working")).toContainText("Remote Networks");

    await expect(page.getByTestId("compare-diff-rule")).toHaveAttribute(
      "data-different",
      "true",
    );
    await expect(page.getByTestId("compare-diff-container")).toHaveAttribute(
      "data-different",
      "true",
    );

    await page.screenshot({
      path: path.join(screensDir, "workspace-compare.png"),
      fullPage: false,
    });

    await page.getByTestId("compare-pin").click();
    await page.getByTestId("compare-continue").click();
    await expect(page.getByTestId("step-reproduce")).toBeVisible();

    await page.getByTestId("reproduce-ask-retry").click();
    await expect(page.getByTestId("live-badge")).toBeVisible();
    await expect(page.getByTestId("log-row-log-traffic-live-ankit-1")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("log-row-log-traffic-live-ankit-2")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("log-row-log-traffic-live-ankit-3")).toBeVisible({
      timeout: 8000,
    });

    await page.getByTestId("reproduce-start-pcap").click();
    await expect(page.getByTestId("pcap-table")).toContainText("STUN");
    await page.getByTestId("reproduce-pin-pcap").click();

    await page.screenshot({
      path: path.join(screensDir, "workspace-reproduce.png"),
      fullPage: false,
    });
  });

  test("/logs shows 600 records and query filters", async ({ page }) => {
    await page.goto("/logs", { waitUntil: "networkidle" });
    await expect(page.getByTestId("logs-page")).toBeVisible();
    await expect(page.getByTestId("logs-seeded-count")).toContainText("600");
    await expect(page.getByTestId("log-loading")).toBeHidden({ timeout: 5000 });
    await expect(page.getByTestId("log-row-count")).toContainText("600");

    await page.getByTestId("log-query").fill(
      "( user.src eq ankit.verma@acme.io ) and ( rule eq Block-QUIC )",
    );
    await page.getByTestId("log-query-apply").click();
    await expect(page.getByTestId("log-loading")).toBeHidden({ timeout: 5000 });
    await expect(page.getByTestId("log-row-log-traffic-ankit-100214")).toBeVisible();
    const countText = await page.getByTestId("log-row-count").innerText();
    const count = Number(countText.replace(/\D/g, ""));
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(600);

    await page.screenshot({
      path: path.join(screensDir, "logs.png"),
      fullPage: false,
    });
  });
});
