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

async function seedTicketToFix(page: Page, ticketId: "TKT-24817" | "TKT-24823") {
  await page.goto("/home", { waitUntil: "networkidle" });
  await page.evaluate((id) => {
    const caseKey = id === "TKT-24817" ? "meet-quic" : "pune-tunnel";
    const otherId = id === "TKT-24817" ? "TKT-24823" : "TKT-24817";
    const otherKey = id === "TKT-24817" ? "pune-tunnel" : "meet-quic";
    const base = {
      ticketId: id,
      caseKey,
      status: "in_progress",
      step: "fix",
      answeredQuestions: ["when", "who", "changes"],
      pendingQuestions: [],
      keyFindings: ["changes"],
      pinnedEvidence: [
        {
          id: `ev-seed-${id}`,
          ticketId: id,
          pinnedAt: "2026-10-06T06:35:00.000Z",
          source: "policy",
          label: "Seeded prove evidence",
          refId: `prove-${id}`,
          note: "",
        },
      ],
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
        {
          id: `${id}-ack`,
          ticketId: id,
          author: "engineer",
          authorName: "Priya Nair",
          body: "Thanks, we are looking into this now.",
          createdAt: "2026-10-06T06:35:00.000Z",
          kind: "acknowledge",
        },
      ],
      evidenceComplete: true,
      compareComplete: true,
      reproduceStarted: true,
      reproduceComplete: true,
      proveComplete: true,
      approvalRequested: false,
      approvalGranted: false,
      fixApplied: false,
      verified: false,
      confirmRequested: false,
      customerConfirmed: false,
      closed: false,
      pushJobPhase: "idle",
      rcaDraft: null,
      auditTrail: [
        {
          id: `audit-seed-${id}`,
          at: "2026-10-06T06:35:00.000Z",
          actor: "engineer",
          actorName: "Priya Nair",
          action: "Completed Prove; unlocked Fix",
        },
      ],
    };
    const other = {
      ...base,
      ticketId: otherId,
      caseKey: otherKey,
      step: "intake",
      status: "open",
      answeredQuestions: [],
      keyFindings: [],
      pinnedEvidence: [],
      evidenceComplete: false,
      compareComplete: false,
      reproduceStarted: false,
      reproduceComplete: false,
      proveComplete: false,
      auditTrail: [],
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

async function runCase1ToClosed(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedTicketToFix(page, "TKT-24817");
  await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });
  await expect(page.getByTestId("step-fix")).toBeVisible();
  await expect(page.getByTestId("fix-rule-diff")).toBeVisible();
  await expect(page.getByTestId("fix-object-removal")).toBeVisible();
  await page.screenshot({
    path: path.join(screensDir, "case1-fix.png"),
    fullPage: false,
  });

  await page.getByTestId("fix-request-approval").click();
  await expect(page.getByText("Approved, go ahead.")).toBeVisible({ timeout: 5000 });
  await page.getByTestId("fix-push-config").click();
  await expect(page.getByTestId("fix-push-stages")).toBeVisible();
  await expect(page.getByTestId("push-stage-success")).toHaveAttribute("data-state", "done", {
    timeout: 8000,
  });
  await page.getByTestId("fix-continue").click();

  await expect(page.getByTestId("step-verify")).toBeVisible();
  await page.getByTestId("verify-rerun").click();
  await expect(page.getByTestId("verify-passed")).toBeVisible();
  await expect(page.getByTestId("verify-output")).toContainText("Allow-Collab-Apps");
  await page.screenshot({
    path: path.join(screensDir, "case1-verify.png"),
    fullPage: false,
  });

  await page.getByTestId("verify-ask-confirm").click();
  await expect(page.getByTestId("verify-confirmed")).toBeVisible({ timeout: 5000 });
  await page.getByTestId("verify-continue").click();

  await expect(page.getByTestId("step-rca")).toBeVisible();
  await expect(page.getByTestId("rca-summary")).not.toHaveValue("");
  await page.screenshot({
    path: path.join(screensDir, "case1-rca.png"),
    fullPage: false,
  });
  await expect(page.getByTestId("audit-trail")).toBeVisible();
  await expect(page.getByTestId("audit-entry").first()).toBeVisible();

  await page.getByTestId("rca-close").click();
  await expect(page.getByTestId("toast")).toContainText("TKT-24817");
  await expect(page).toHaveURL(/\/tickets$/);
}

async function runCase2ToClosed(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedTicketToFix(page, "TKT-24823");
  await page.goto("/tickets/TKT-24823", { waitUntil: "networkidle" });
  await expect(page.getByTestId("step-fix")).toBeVisible();
  await expect(page.getByTestId("fix-crypto-diff")).toBeVisible();
  await expect(page.getByTestId("fix-revert-command")).toContainText("dh-group group14");
  await page.screenshot({
    path: path.join(screensDir, "case2-fix.png"),
    fullPage: false,
  });

  await page.getByTestId("fix-request-approval").click();
  await expect(page.getByText("Applied and committed.")).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("fix-applied-note")).toBeVisible();
  await page.getByTestId("fix-continue").click();

  await expect(page.getByTestId("step-verify")).toBeVisible();
  await page.getByTestId("verify-rerun").click();
  await expect(page.getByTestId("verify-passed")).toBeVisible();
  await expect(page.getByTestId("verify-pune-up")).toContainText("up");
  await page.screenshot({
    path: path.join(screensDir, "case2-verify.png"),
    fullPage: false,
  });

  await page.getByTestId("verify-ask-confirm").click();
  await expect(page.getByText("Pune is back.")).toBeVisible({ timeout: 5000 });
  await page.getByTestId("verify-continue").click();

  await expect(page.getByTestId("step-rca")).toBeVisible();
  await page.screenshot({
    path: path.join(screensDir, "case2-rca.png"),
    fullPage: false,
  });
  await page.getByTestId("rca-close").click();
  await expect(page.getByTestId("toast")).toContainText("TKT-24823");
  await expect(page).toHaveURL(/\/tickets$/);
}

test.describe("Phase 7 fix, verify, RCA, close", () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoSession(page);
    await skipSplashForSession(page);
    await signInAsAdmin(page);
    await resetCaseEngine(page);
  });

  test("Case 1 end to end from login to closed", async ({ page }) => {
    await expect(page).toHaveURL(/\/home$/);
    await runCase1ToClosed(page);

    await page.getByTestId("tickets-tab-resolved").click();
    await expect(page.getByTestId("ticket-card-TKT-24817")).toBeVisible();
  });

  test("Case 2 end to end fix verify close and Home updates", async ({ page }) => {
    await runCase2ToClosed(page);

    await page.goto("/home", { waitUntil: "networkidle" });
    await expect(page.getByTestId("home-page")).toBeVisible();
    await expect(page.getByTestId("pune-health")).toContainText("Pune-Branch-01 up");

    await page.goto("/remote-networks", { waitUntil: "networkidle" });
    await expect(page.getByText(/Pune-Branch-01 up/)).toBeVisible();
  });

  test("Reset demo restores both cases", async ({ page }) => {
    await seedTicketToFix(page, "TKT-24823");
    await page.goto("/tickets/TKT-24823", { waitUntil: "networkidle" });
    await page.getByTestId("fix-request-approval").click();
    await expect(page.getByTestId("fix-applied-note")).toBeVisible({ timeout: 5000 });

    await page.getByTestId("user-menu").click();
    await page.getByTestId("reset-demo").click();

    await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });
    await expect(page.getByTestId("step-intake")).toBeVisible();
    await page.goto("/tickets/TKT-24823", { waitUntil: "networkidle" });
    await expect(page.getByTestId("step-intake")).toBeVisible();

    await page.goto("/home", { waitUntil: "networkidle" });
    await expect(page.getByTestId("pune-health")).toContainText("Pune-Branch-01 down");
  });
});
