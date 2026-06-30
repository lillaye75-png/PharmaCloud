import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "cd backend && uvicorn app.main:app --reload --port 8001",
    port: 8001,
    timeout: 30000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "PharmaCloud Local",
      use: {
        baseURL: "http://localhost:3000",
      },
    },
  ],
});
