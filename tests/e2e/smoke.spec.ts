import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { clearDemoSession, signInAsAdmin, skipSplashForSession } from "./helpers/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.join(__dirname, "screens");

const protectedRoutes: { path: string; name: string; heading: string }[] = [
  { path: "/home", name: "home", heading: "Home" },
  { path: "/tickets", name: "tickets", heading: "Tickets" },
  { path: "/tickets/TKT-24817", name: "ticket-detail", heading: "Ticket workspace" },
  { path: "/logs", name: "logs", heading: "Logs" },
  { path: "/policies", name: "policies", heading: "Policies" },
  { path: "/objects", name: "objects", heading: "Objects" },
  { path: "/remote-networks", name: "remote-networks", heading: "Remote networks" },
  { path: "/mobile-users", name: "mobile-users", heading: "Mobile users" },
  { path: "/config-audit", name: "config-audit", heading: "Config audit" },
  { path: "/troubleshooting", name: "troubleshooting", heading: "Troubleshooting" },
  { path: "/brief", name: "brief", heading: "Brief" },
];

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    errors.push(err.message);
  });
  return errors;
}

test.describe("Phase 0 smoke", () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoSession(page);
  });

  test("public splash and login load without console errors", async ({ page }) => {
    const errors = await collectConsoleErrors(page);

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByTestId("splash-name")).toHaveText("Sarthak Pant");
    await page.screenshot({
      path: path.join(screensDir, "splash.png"),
      fullPage: false,
    });

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Admin console" })).toBeVisible();
    await page.screenshot({
      path: path.join(screensDir, "login-smoke.png"),
      fullPage: false,
    });

    expect(errors, `Console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("every protected route loads without console errors when signed in", async ({
    page,
  }) => {
    const errors = await collectConsoleErrors(page);
    await skipSplashForSession(page);
    await signInAsAdmin(page);

    for (const route of protectedRoutes) {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      await page.screenshot({
        path: path.join(screensDir, `${route.name}.png`),
        fullPage: false,
      });
    }

    expect(errors, `Console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("hard refresh on /tickets/TKT-24817 does not 404", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await skipSplashForSession(page);
    await signInAsAdmin(page);

    await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Ticket workspace" })).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Ticket workspace" })).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);

    await page.screenshot({
      path: path.join(screensDir, "ticket-detail-refresh.png"),
      fullPage: false,
    });

    expect(errors, `Console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("unknown route shows designed 404", async ({ page }) => {
    await page.goto("/does-not-exist", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "This route does not exist" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Tickets" })).toBeVisible();
    await page.screenshot({
      path: path.join(screensDir, "not-found.png"),
      fullPage: false,
    });
  });
});
