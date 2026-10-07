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

async function openConsole(page: Page) {
  await page.keyboard.press("Control+`");
  await expect(page.getByTestId("console-drawer")).toHaveAttribute("data-open", "true");
}

async function seedTicketToProve(page: Page, ticketId: "TKT-24817" | "TKT-24823") {
  await page.goto("/home", { waitUntil: "networkidle" });
  await page.evaluate((id) => {
    const caseKey = id === "TKT-24817" ? "meet-quic" : "pune-tunnel";
    const otherId = id === "TKT-24817" ? "TKT-24823" : "TKT-24817";
    const otherKey = id === "TKT-24817" ? "pune-tunnel" : "meet-quic";
    const base = {
      ticketId: id,
      caseKey,
      status: "in_progress",
      step: "prove",
      answeredQuestions: ["when", "who"],
      pendingQuestions: [],
      keyFindings: [],
      pinnedEvidence: [],
      thread: [
        {
          id: `${id}-intake`,
          ticketId: id,
          author: "customer",
          authorName: "Customer",
          body: "Intake",
          createdAt: "2026-10-06T04:42:00.000Z",
          kind: "intake",
        },
      ],
      evidenceComplete: true,
      compareComplete: true,
      reproduceStarted: true,
      reproduceComplete: true,
      proveComplete: false,
      approvalRequested: false,
      approvalGranted: false,
      fixApplied: false,
      verified: false,
      customerConfirmed: false,
      closed: false,
      pushJobPhase: "idle",
    };
    const other = {
      ...base,
      ticketId: otherId,
      caseKey: otherKey,
      step: "intake",
      status: "open",
      answeredQuestions: [],
      evidenceComplete: false,
      compareComplete: false,
      reproduceStarted: false,
      reproduceComplete: false,
      thread: [
        {
          id: `${otherId}-intake`,
          ticketId: otherId,
          author: "customer",
          authorName: "Customer",
          body: "Intake",
          createdAt: "2026-10-06T06:14:00.000Z",
          kind: "intake",
        },
      ],
    };
    const payload = {
      state: {
        tickets: {
          "TKT-24817": id === "TKT-24817" ? base : other,
          "TKT-24823": id === "TKT-24823" ? base : other,
        },
      },
      version: 0,
    };
    localStorage.setItem("triage-case-engine", JSON.stringify(payload));
  }, ticketId);
  await page.reload({ waitUntil: "networkidle" });
}

test.describe("Phase 6 console and troubleshooting", () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoSession(page);
    await skipSplashForSession(page);
    await signInAsAdmin(page);
    await resetCaseEngine(page);
  });

  test("Case 2 branch console commands and pin", async ({ page }) => {
    await page.goto("/tickets/TKT-24823", { waitUntil: "networkidle" });
    await openConsole(page);

    await page.getByTestId("console-mode-prisma").click();
    await expect(page.getByTestId("console-drawer")).toHaveAttribute("data-mode", "prisma");
    await page.getByTestId("console-input").fill("show remote-network status");
    await page.getByTestId("console-input").press("Enter");
    await expect(page.getByTestId("console-output")).toContainText("Pune-Branch-01");
    await page.screenshot({
      path: path.join(screensDir, "console-prisma.png"),
      fullPage: false,
    });

    await page.getByTestId("console-mode-branch").click();
    await expect(page.getByTestId("console-drawer")).toHaveAttribute("data-mode", "branch");

    const commands = [
      "show vpn ike-sa gateway gw-prisma-pune",
      "show vpn ipsec-sa tunnel tun-prisma-pune",
      "test vpn ipsec-sa tunnel tun-prisma-pune",
      "less mp-log ikemgr.log",
      "show config diff",
      "show vpn flow tunnel-id 7",
    ];

    for (const cmd of commands) {
      await page.getByTestId("console-input").fill(cmd);
      await page.getByTestId("console-input").press("Enter");
    }

    const output = page.getByTestId("console-output");
    await expect(output).toContainText("IKE SA established");
    await expect(output).toContainText("There is no IPSec SA found");
    await expect(output).toContainText("NO_PROPOSAL_CHOSEN");
    await expect(output).toContainText("group 19");
    await expect(output).toContainText("group14");
    await expect(output).toContainText("inactive");

    await page.screenshot({
      path: path.join(screensDir, "console-branch.png"),
      fullPage: false,
    });

    const pinButtons = page.locator('[data-testid^="console-pin-"]');
    await expect(pinButtons.first()).toBeEnabled();
    await pinButtons.first().click();
    await expect(pinButtons.first()).toContainText("Pinned");
    await expect(page.getByTestId("evidence-list")).toContainText("Console:");
  });

  test("Case 1 policy match returns Block-QUIC deny", async ({ page }) => {
    await seedTicketToProve(page, "TKT-24817");
    await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });
    await expect(page.getByTestId("step-prove")).toBeVisible();

    await page.getByTestId("prove-run-match").click();
    await expect(page.getByTestId("prove-match-output")).toContainText("Block-QUIC");
    await expect(page.getByTestId("prove-match-output")).toContainText("deny");

    await page.getByTestId("prove-pin-match").click();
    await expect(page.getByTestId("evidence-list")).toContainText("Block-QUIC");
    await expect(page.getByTestId("prove-continue")).toBeEnabled();
  });

  test("Troubleshooting tools page shows policy, ping, traceroute, tunnel", async ({
    page,
  }) => {
    await page.goto("/troubleshooting", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Troubleshooting" })).toBeVisible();

    await page.getByTestId("tools-policy-run").click();
    await expect(page.getByTestId("tools-policy-result")).toContainText("Block-QUIC");
    await expect(page.getByTestId("tools-policy-result")).toContainText("deny");

    await page.getByTestId("tools-tab-ping").click();
    await page.getByTestId("tools-ping-run").click();
    await expect(page.getByTestId("tools-ping-result")).toContainText("8.8.8.8");

    await page.getByTestId("tools-tab-traceroute").click();
    await page.getByTestId("tools-traceroute-run").click();
    await expect(page.getByTestId("tools-traceroute-result")).toContainText("traceroute");

    await page.getByTestId("tools-tab-tunnel").click();
    await page.getByTestId("tools-tunnel-run").click();
    await expect(page.getByTestId("tools-tunnel-result")).toContainText("Pune-Branch-01");
    await expect(page.getByTestId("tools-tunnel-result")).toContainText("Missing");

    await page.screenshot({
      path: path.join(screensDir, "tools.png"),
      fullPage: false,
    });
  });
});
