import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.join(__dirname, "screens");

const routes: { path: string; name: string }[] = [
  { path: "/", name: "splash" },
  { path: "/login", name: "login" },
  { path: "/home", name: "home" },
  { path: "/tickets", name: "tickets" },
  { path: "/tickets/TKT-24817", name: "ticket-detail" },
  { path: "/logs", name: "logs" },
  { path: "/policies", name: "policies" },
  { path: "/objects", name: "objects" },
  { path: "/remote-networks", name: "remote-networks" },
  { path: "/mobile-users", name: "mobile-users" },
  { path: "/config-audit", name: "config-audit" },
  { path: "/troubleshooting", name: "troubleshooting" },
  { path: "/brief", name: "brief" },
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
  test("every route loads without console errors", async ({ page }) => {
    const errors = await collectConsoleErrors(page);

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading").first()).toBeVisible();
      await page.screenshot({
        path: path.join(screensDir, `${route.name}.png`),
        fullPage: false,
      });
    }

    expect(errors, `Console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("hard refresh on /tickets/TKT-24817 does not 404", async ({ page }) => {
    const errors = await collectConsoleErrors(page);

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
