import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { clearDemoSession, signInAsAdmin, skipSplashForSession } from "./helpers/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.join(__dirname, "screens");

async function waitReady(page: Page, loadingTestId: string) {
  await expect(page.getByTestId(loadingTestId)).toHaveCount(0, { timeout: 10_000 });
}

test.describe("Phase 8 supporting pages", () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoSession(page);
    await skipSplashForSession(page);
    await signInAsAdmin(page);
  });

  test("policies shows Block-QUIC modified marker and drawer history", async ({ page }) => {
    await page.goto("/policies?q=Block-QUIC", { waitUntil: "networkidle" });
    await waitReady(page, "policies-loading");
    await expect(page.getByRole("heading", { name: "Policies" })).toBeVisible();
    await expect(page.getByTestId("seeded-summary")).toContainText("32 security rules");
    await expect(page.getByTestId("policy-row-Block-QUIC")).toBeVisible();
    await expect(page.getByTestId("modified-marker-Block-QUIC")).toContainText(
      "Modified 12h ago",
    );
    await page.getByTestId("policy-row-Block-QUIC").click();
    await expect(page.getByTestId("policy-drawer")).toBeVisible();
    await expect(page.getByTestId("policy-history-CHG-5120")).toBeVisible();
    await page.screenshot({
      path: path.join(screensDir, "policies-block-quic.png"),
      fullPage: false,
    });

    await page.getByTestId("policies-tab-decryption").click();
    await waitReady(page, "policies-loading");
    await expect(page.getByTestId("policies-table")).toBeVisible();
    await page.screenshot({
      path: path.join(screensDir, "policies-decryption.png"),
      fullPage: false,
    });
  });

  test("objects where-used links svc-quic-block to Block-QUIC", async ({ page }) => {
    await page.goto("/objects?q=svc-quic-block&tab=services", { waitUntil: "networkidle" });
    await waitReady(page, "objects-loading");
    await expect(page.getByRole("heading", { name: "Objects" })).toBeVisible();
    await expect(page.getByTestId("object-row-svc-quic-block")).toBeVisible();
    await expect(
      page.getByTestId("where-used-svc-quic-block-Block-QUIC"),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(screensDir, "objects-svc-quic.png"),
      fullPage: false,
    });

    await page.getByTestId("where-used-svc-quic-block-Block-QUIC").click();
    await expect(page).toHaveURL(/\/policies/);
    await waitReady(page, "policies-loading");
    await expect(page.getByTestId("policy-row-Block-QUIC")).toBeVisible();
    await page.screenshot({
      path: path.join(screensDir, "objects-to-policy.png"),
      fullPage: false,
    });
  });

  test("remote networks shows Pune down and tunnel history", async ({ page }) => {
    await page.goto("/remote-networks?status=down", { waitUntil: "networkidle" });
    await waitReady(page, "rn-loading");
    await expect(page.getByRole("heading", { name: "Remote networks" })).toBeVisible();
    await expect(page.getByTestId("rn-row-rn-pune-branch-01")).toBeVisible();
    await expect(page.getByTestId("rn-status-rn-pune-branch-01")).toContainText("Down");
    await page.getByTestId("rn-row-rn-pune-branch-01").click();
    await expect(page.getByTestId("rn-drawer")).toBeVisible();
    await expect(page.getByTestId("rn-tunnel-history")).toBeVisible();
    await expect(page.getByTestId("rn-history-down")).toBeVisible();
    await page.screenshot({
      path: path.join(screensDir, "remote-networks-pune.png"),
      fullPage: false,
    });

    await page.getByTestId("rn-logs-link").click();
    await expect(page).toHaveURL(/\/logs/);
    await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();
  });

  test("mobile users table shows seeded connected users", async ({ page }) => {
    await page.goto("/mobile-users", { waitUntil: "networkidle" });
    await waitReady(page, "mu-loading");
    await expect(page.getByRole("heading", { name: "Mobile users" })).toBeVisible();
    await expect(page.getByTestId("mu-table")).toBeVisible();
    await expect(page.getByTestId("mu-row-ankit.verma@acme.io")).toBeVisible();
    await page.screenshot({
      path: path.join(screensDir, "mobile-users.png"),
      fullPage: false,
    });

    await page.getByTestId("mu-logs-ankit.verma@acme.io").click();
    await expect(page).toHaveURL(/\/logs/);
  });

  test("config audit opens CHG-5120 and CHG-4471 diffs with cross-links", async ({ page }) => {
    await page.goto("/config-audit?change=CHG-5120", { waitUntil: "networkidle" });
    await waitReady(page, "audit-loading");
    await expect(page.getByRole("heading", { name: "Config audit" })).toBeVisible();
    await expect(page.getByTestId("audit-row-CHG-5120")).toBeVisible();
    await expect(page.getByTestId("audit-drawer")).toBeVisible();
    await expect(page.getByTestId("audit-diff")).toBeVisible();
    await expect(page.getByTestId("audit-diff-after")).toContainText("Block-QUIC");
    await page.screenshot({
      path: path.join(screensDir, "config-audit-5120.png"),
      fullPage: false,
    });

    await page.getByTestId("audit-rule-link").click();
    await expect(page).toHaveURL(/\/policies/);
    await waitReady(page, "policies-loading");
    await expect(page.getByTestId("policy-row-Block-QUIC")).toBeVisible();

    await page.goto("/config-audit?change=CHG-4471", { waitUntil: "networkidle" });
    await waitReady(page, "audit-loading");
    await expect(page.getByTestId("audit-drawer")).toBeVisible();
    await expect(page.getByTestId("audit-diff-after")).toContainText("group19");
    await page.screenshot({
      path: path.join(screensDir, "config-audit-4471.png"),
      fullPage: false,
    });
  });

  test("brief shows problem persona playbook and credits", async ({ page }) => {
    await page.goto("/brief", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Brief" })).toBeVisible();
    await expect(page.getByTestId("brief-problem")).toBeVisible();
    await expect(page.getByTestId("brief-persona")).toContainText("Priya Nair");
    await expect(page.getByTestId("brief-playbook")).toBeVisible();
    await expect(page.getByTestId("brief-built-by")).toHaveText("Built by Sarthak Pant");
    await page.screenshot({ path: path.join(screensDir, "brief.png"), fullPage: false });
  });

  test("empty and error states work on policies", async ({ page }) => {
    await page.goto("/policies?q=zzz-no-such-rule", { waitUntil: "networkidle" });
    await waitReady(page, "policies-loading");
    await expect(page.getByTestId("policies-empty")).toBeVisible();
    await page.screenshot({
      path: path.join(screensDir, "policies-empty.png"),
      fullPage: false,
    });

    await page.goto("/policies?error=1", { waitUntil: "networkidle" });
    await expect(page.getByTestId("policies-error")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("policies-error-retry").click();
    await waitReady(page, "policies-loading");
    await expect(page.getByTestId("policies-table")).toBeVisible();
  });

  test("troubleshooting still works after Phase 8", async ({ page }) => {
    await page.goto("/troubleshooting", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Troubleshooting" })).toBeVisible();
    await page.getByTestId("tools-preset-case1").click();
    await page.getByTestId("tools-policy-run").click();
    await expect(page.getByTestId("tools-policy-result")).toContainText("Block-QUIC");
    await page.screenshot({
      path: path.join(screensDir, "troubleshooting-phase8.png"),
      fullPage: false,
    });
  });
});
