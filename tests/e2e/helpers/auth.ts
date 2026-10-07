import { expect, type Page } from "@playwright/test";

/** Sign in through the login form. Assumes splash already skipped or session marked. */
export async function signInAsAdmin(page: Page): Promise<void> {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByTestId("fill-for-me").click();
  await page.getByTestId("sign-in").click();
  await expect(page).toHaveURL(/\/home$/);
}

/** Clear demo auth and splash flags so the next visit is signed out. */
export async function clearDemoSession(page: Page): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    try {
      sessionStorage.removeItem("triage.auth");
      sessionStorage.removeItem("triage.splashSeen");
    } catch {
      // ignore
    }
  });
}

/** Mark splash as already seen so /login is reachable without waiting. */
export async function skipSplashForSession(page: Page): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    try {
      sessionStorage.setItem("triage.splashSeen", "1");
    } catch {
      // ignore
    }
  });
}
