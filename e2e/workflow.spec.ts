import { test, expect } from "@playwright/test";

const API = "http://localhost:8001/api/v1";

test.describe("Full Workflow: Product → Sale → Stock → Report", () => {
  let token = "";
  let productId = "";
  let productName = `E2E-Test-${Date.now()}`;

  test("API: Login as owner", async ({ request }) => {
    const resp = await request.post(`${API}/auth/login`, {
      data: { email: "owner@pharmacie.sn", password: "password123" },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    token = body.access_token;
    expect(token).toBeTruthy();
  });

  test("API: Create a product", async ({ request }) => {
    const resp = await request.post(`${API}/products/`, {
      data: {
        name: productName,
        selling_price: 2500,
        purchase_price: 1800,
        current_stock: 50,
        min_stock_alert: 5,
        category: "Médicament",
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    productId = body.id;
    expect(body.name).toBe(productName);
    expect(body.current_stock).toBe(50);
  });

  test("API: Verify product in list", async ({ request }) => {
    const resp = await request.get(`${API}/products/?size=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const found = body.find((p: any) => p.name === productName);
    expect(found).toBeTruthy();
    expect(found.selling_price).toBe(2500);
  });

  test("API: Create a sale", async ({ request }) => {
    const resp = await request.post(`${API}/sales/`, {
      data: {
        payment_method: "cash",
        items: [{ product_id: productId, quantity: 3, unit_price: 2500 }],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.status).toBe("completed");
    expect(body.total_amount).toBe(7500);
  });

  test("API: Stock decremented after sale", async ({ request }) => {
    const resp = await request.get(`${API}/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.current_stock).toBe(47);
  });

  test("API: Sales report shows data", async ({ request }) => {
    const resp = await request.get(`${API}/reports/sales?period=today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.total_sales).toBeGreaterThanOrEqual(1);
    expect(body.total_revenue).toBeGreaterThanOrEqual(7500);
  });

  test("API: Inventory report accessible", async ({ request }) => {
    const resp = await request.get(`${API}/reports/inventory`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.total_products).toBeGreaterThan(0);
    expect(typeof body.low_stock_count).toBe("number");
  });

  test("API: Accounting report shows data", async ({ request }) => {
    const resp = await request.get(`${API}/reports/accounting`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.revenue).toBeGreaterThanOrEqual(0);
    expect(typeof body.profit).toBe("number");
  });

  test("FRONTEND: Landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /PharmaCloud/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fonctionnalités" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tarifs" })).toBeVisible();
  });

  test("FRONTEND: Login page and form works", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await page.fill('input[type="email"]', "owner@pharmacie.sn");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/caisse", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Caisse" })).toBeVisible();
  });

  test("FRONTEND: Dashboard shows after login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "owner@pharmacie.sn");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/caisse", { timeout: 15000 });
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();
  });

  test("FRONTEND: Products page accessible", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "owner@pharmacie.sn");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/caisse", { timeout: 15000 });
    await page.goto("/produits");
    await expect(page.getByRole("heading", { name: "Produits" })).toBeVisible();
  });

  test("FRONTEND: Rapports page loads", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "owner@pharmacie.sn");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/caisse", { timeout: 15000 });
    await page.goto("/rapports");
    await expect(page.getByRole("heading", { name: "Rapports" })).toBeVisible();
  });

  test("FRONTEND: Commandes page loads", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "owner@pharmacie.sn");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/caisse", { timeout: 15000 });
    await page.goto("/commandes");
    await expect(page.getByRole("heading", { name: "Commandes" })).toBeVisible();
  });
});
