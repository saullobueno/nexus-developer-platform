import { expect, test } from "@playwright/test";

test("home page mostra o heading da plataforma", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nexus Developer Platform" })).toBeVisible();
});
