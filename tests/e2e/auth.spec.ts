import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { clearDemoSession, skipSplashForSession } from "./helpers/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.join(__dirname, "screens");

test.describe("Phase 2 splash and login", () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoSession(page);
  });

  test("splash shows name and skips to login", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.getByTestId("splash")).toBeVisible();
    await expect(page.getByTestId("splash-name")).toHaveText("Sarthak Pant");

    // Mid-animation frame while progress is still climbing
    await expect
      .poll(async () => page.getByTestId("splash").getAttribute("data-splash-phase"))
      .toBe("mid");
    await page.screenshot({
      path: path.join(screensDir, "splash-mid.png"),
      fullPage: false,
    });

    // Final composition: name visible and progress mostly complete
    await expect(page.getByTestId("splash-name")).toBeVisible();
    await expect(page.getByTestId("splash-subtitle")).toBeVisible();
    await expect
      .poll(
        async () => Number(await page.getByTestId("splash").getAttribute("data-splash-progress")),
        { timeout: 4000 },
      )
      .toBeGreaterThan(0.75);
    await page.screenshot({
      path: path.join(screensDir, "splash-final.png"),
      fullPage: false,
    });

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId("login")).toBeVisible();
  });

  test("wrong credentials show inline error", async ({ page }) => {
    await skipSplashForSession(page);
    await page.goto("/login", { waitUntil: "networkidle" });

    await page.getByTestId("login-username").fill("admin");
    await page.getByTestId("login-password").fill("wrong");
    await page.getByTestId("sign-in").click();

    await expect(page.getByTestId("login-error")).toHaveText(
      "Username or password is incorrect",
    );
    await expect(page.getByTestId("login-password")).toBeFocused();
    await expect(page).toHaveURL(/\/login$/);

    await page.screenshot({
      path: path.join(screensDir, "login-error.png"),
      fullPage: false,
    });
  });

  test("right credentials land on home", async ({ page }) => {
    await skipSplashForSession(page);
    await page.goto("/login", { waitUntil: "networkidle" });

    await page.screenshot({
      path: path.join(screensDir, "login.png"),
      fullPage: false,
    });

    await page.getByTestId("fill-for-me").click();
    await expect(page.getByTestId("login-username")).toHaveValue("admin");
    await expect(page.getByTestId("login-password")).toHaveValue("12345");

    await page.getByTestId("sign-in").click();
    await expect(page.getByTestId("sign-in")).toHaveText("Signing in");
    await expect(page).toHaveURL(/\/home$/, { timeout: 5000 });
    await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  });

  test("signed-out deep link returns to ticket after sign-in", async ({ page }) => {
    await skipSplashForSession(page);
    await page.goto("/tickets/TKT-24817", { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId("login")).toBeVisible();

    await page.getByTestId("fill-for-me").click();
    await page.getByTestId("sign-in").click();

    await expect(page).toHaveURL(/\/tickets\/TKT-24817$/, { timeout: 5000 });
    await expect(page.getByTestId("ticket-workspace")).toBeVisible();
    await expect(page.getByTestId("ticket-workspace-title")).toHaveText("TKT-24817");
  });
});
