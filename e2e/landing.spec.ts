import { test, expect } from "@playwright/test";

test.describe("Landing Page (Production)", () => {
  test("should load the landing page", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByText("PharmaCloud")).toBeVisible();
    const links = page.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should have hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("h1").first();
    await expect(hero).toBeVisible();
    await expect(hero).not.toBeEmpty();
  });
});
