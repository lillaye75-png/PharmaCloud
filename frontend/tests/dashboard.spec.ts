import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "owner@pharmacie.sn");
    await page.fill('input[type="password"]', "password123");
    await page.click('button:has-text("Se connecter")');
    await page.waitForURL("**/caisse");
  });

  test("should navigate to products", async ({ page }) => {
    await page.goto("http://localhost:3000/produits");
    await expect(page.locator("text=Produits")).toBeVisible();
  });

  test("should navigate to categories", async ({ page }) => {
    await page.goto("http://localhost:3000/categories");
    await expect(page.locator("text=Catégories")).toBeVisible();
  });

  test("should navigate to inventaire", async ({ page }) => {
    await page.goto("http://localhost:3000/inventaire");
    await expect(page.locator("text=Inventaire")).toBeVisible();
  });

  test("should navigate to rapports", async ({ page }) => {
    await page.goto("http://localhost:3000/rapports");
    await expect(page.locator("text=Rapports")).toBeVisible();
  });
});
