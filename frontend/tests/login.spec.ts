import { test, expect } from "@playwright/test";

test.describe("PharmaCloud Authentication", () => {
  test("should load landing page", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await expect(page.locator("text=PharmaCloud")).toBeVisible();
  });

  test("should show login form", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Se connecter")')).toBeVisible();
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "owner@pharmacie.sn");
    await page.fill('input[type="password"]', "password123");
    await page.click('button:has-text("Se connecter")');
    await page.waitForURL("**/caisse");
    await expect(page.locator("text=Caisse")).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "wrong@email.com");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button:has-text("Se connecter")');
    await expect(page.locator("text=Invalid credentials")).toBeVisible();
  });
});
