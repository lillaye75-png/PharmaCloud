import { test, expect } from "@playwright/test";

test.describe("Backend API (Production)", () => {
  const API_URL = "https://pharmacloud-backend.onrender.com";

  test("health endpoint returns 200", async ({ request }) => {
    const resp = await request.get(`${API_URL}/health`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe("ok");
  });

  test("auth endpoints are reachable", async ({ request }) => {
    const resp = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: "owner@pharmacie.sn", password: "wrong-password" },
    });
    expect(resp.status()).toBe(401);
  });
});
