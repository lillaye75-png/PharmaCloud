import { test, expect } from "@playwright/test";

test.describe("Authentication (Production)", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("button[type='submit']")).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test("should reject invalid credentials", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator("button[type='submit']").first();
    await emailInput.fill("wrong@test.com");
    await passwordInput.fill("wrongpassword");
    await submitBtn.click();
    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    expect(currentUrl).toContain("login");
  });
});
